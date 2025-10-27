
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, Company } from '../types';
import { getChatResponseStream, analyzeImageWithPrompt, initiateTranscription, createAudioBlob } from '../services/finGptService';
import { ChatBubbleIcon, LoadingSpinner, PaperAirplaneIcon, PaperclipIcon, XMarkIcon, MicrophoneIcon, MicrophoneSlashIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface ChatbotProps {
    selectedCompany: Company | null;
}

export const Chatbot: React.FC<ChatbotProps> = ({ selectedCompany }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hello! I am your AI financial assistant. How can I help you today?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [uploadedImage, setUploadedImage] = useState<{file: File, preview: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleSendMessage = useCallback(async () => {
        if (isLoading || (!userInput.trim() && !uploadedImage)) return;

        const textToSend = userInput.trim();
        const imageToSend = uploadedImage?.preview;
        const userMessage: ChatMessage = { role: 'user', text: textToSend, image: imageToSend };
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);
        
        setUserInput('');
        setUploadedImage(null);
        setIsLoading(true);

        try {
            if (uploadedImage) {
                const base64Image = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(uploadedImage.file);
                });
                const responseText = await analyzeImageWithPrompt(base64Image, uploadedImage.file.type, textToSend);
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = responseText;
                    return newMessages;
                });
            } else {
                const stream = await getChatResponseStream(messages, textToSend, selectedCompany);
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].text += chunkText;
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error(error);
             setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = 'An error occurred. Please try again.';
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [userInput, uploadedImage, isLoading, messages, selectedCompany]);

    const stopRecording = useCallback(() => {
        setIsRecording(false);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (isRecording) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            setIsRecording(true);
            setUserInput(''); // Clear input for transcription

            sessionPromiseRef.current = initiateTranscription((text) => {
                setUserInput(text);
            });
            
            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = context;

            const source = context.createMediaStreamSource(stream);
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createAudioBlob(inputData);
                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(context.destination);
        } catch(err) {
            console.error("Error starting recording:", err);
            // Let user know there was an error
            setUserInput("Microphone access denied or an error occurred.");
            stopRecording();
        }
    }, [isRecording, stopRecording]);
    
    const handleMicClick = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    useEffect(() => {
        return () => {
            stopRecording();
        }
    }, [stopRecording]);

    return (
        <>
            <div className={`fixed bottom-5 right-5 z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-24 opacity-0' : 'translate-x-0 opacity-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                    aria-label="Open chat"
                >
                    <ChatBubbleIcon className="h-8 w-8" />
                </button>
            </div>

            <div className={`fixed bottom-5 right-5 z-20 w-full max-w-sm h-[70vh] max-h-[600px] flex flex-col bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
                    <div>
                        <h3 className="font-bold text-white">AI Financial Assistant</h3>
                        {selectedCompany && <p className="text-xs text-cyan-400">Context: {selectedCompany.ticker}</p>}
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                {msg.image && (
                                    <img src={msg.image} alt="uploaded content" className="rounded-md mb-2 max-h-40" />
                                )}
                                <div className="prose prose-invert prose-sm max-w-none text-white leading-relaxed">
                                    {msg.text ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <LoadingSpinner />}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-700">
                    {uploadedImage && (
                        <div className="mb-2 relative w-24">
                            <img src={uploadedImage.preview} alt="upload preview" className="rounded-md h-24 w-24 object-cover" />
                            <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                        <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-cyan-400 p-2 rounded-md hover:bg-gray-700">
                           <PaperclipIcon className="h-5 w-5" />
                        </button>
                         <button onClick={handleMicClick} className={`${isRecording ? 'text-red-400' : 'text-gray-400'} hover:text-cyan-400 p-2 rounded-md hover:bg-gray-700`}>
                           {isRecording ? <MicrophoneSlashIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={isRecording ? "Listening..." : "Ask a question..."}
                            rows={1}
                            disabled={isRecording}
                            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none disabled:cursor-not-allowed"
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || isRecording || (!userInput.trim() && !uploadedImage)} className="bg-cyan-500 text-white rounded-md p-2 disabled:bg-cyan-800 disabled:cursor-not-allowed transition-colors">
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};