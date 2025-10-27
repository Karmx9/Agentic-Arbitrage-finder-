import { GoogleGenAI, Type, GenerateContentResponse, Chat, LiveSession, Modality, Blob } from "@google/genai";
import type { Company, MockData, ProposedStrategy, BacktestResult, ChatMessage, FullBacktest, OptionsChain, Opportunity } from '../types';

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Resilient API Caller with Queue and Exponential Backoff ---
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

async function processRequestQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;

    isProcessingQueue = true;
    const task = requestQueue.shift();
    if (task) {
        await task();
    }
    
    // A small cool-down period between requests to further respect rate limits.
    await new Promise(resolve => setTimeout(resolve, 500)); 

    isProcessingQueue = false;
    processRequestQueue(); // Process next item
}

/**
 * A wrapper for ai.models.generateContent that includes a request queue to serialize API calls
 * and a retry mechanism with exponential backoff to handle transient errors like rate limiting.
 */
function generateContentWithRetry(params: Parameters<typeof ai.models.generateContent>[0]): Promise<GenerateContentResponse> {
    return new Promise((resolve, reject) => {
        const task = async () => {
            let lastError: any = null;
            for (let i = 0; i < MAX_RETRIES; i++) {
                try {
                    const result = await ai.models.generateContent(params);
                    resolve(result);
                    return; // Task is done, resolve the outer promise
                } catch (error: any) {
                    lastError = error;
                    const isRateLimitError = error.toString().includes('RESOURCE_EXHAUSTED') || error.toString().includes('429');

                    if (isRateLimitError && i < MAX_RETRIES - 1) { // Don't wait on the last attempt
                        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, i);
                        console.warn(`Rate limit exceeded. Retrying in ${backoff}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
                        await new Promise(res => setTimeout(res, backoff));
                    } else {
                        // If it's not a rate limit error, or it is the last retry:
                        console.error("Gemini API call failed with a non-retriable error or after all retries:", error);
                        reject(error); // Reject the outer promise
                        return; // Task failed
                    }
                }
            }
        };
        
        requestQueue.push(task);
        if (!isProcessingQueue) {
            processRequestQueue();
        }
    });
}


// Re-usable chat session for the chatbot
let chat: Chat | null = null;
const getChat = () => {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a helpful and friendly financial markets assistant. Answer questions clearly and concisely. You can explain complex financial topics, provide information about companies, and analyze market data.",
            },
        });
    }
    return chat;
}

export async function getChatResponseStream(history: ChatMessage[], newMessage: string, companyContext: Company | null) {
    try {
        let fullPrompt = newMessage;
        if (companyContext) {
            fullPrompt = `Current context: The user is analyzing ${companyContext.name} (${companyContext.ticker}). Please factor this into your response.\n\nUser question: ${newMessage}`;
        }
        const chatSession = getChat();
        const result = await chatSession.sendMessageStream({ message: fullPrompt });
        
        return (async function* () {
            for await (const chunk of result) {
                // The chunk is a GenerateContentResponse, we yield the text part.
                yield { text: chunk.text };
            }
        })();

    } catch (error) {
        console.error("Error getting chat response:", error);
        return (async function* () {
            yield { text: "Sorry, I encountered an error. Please try again." };
        })();
    }
}

export async function analyzeImageWithPrompt(base64Image: string, mimeType: string, prompt: string): Promise<string> {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "Sorry, I was unable to analyze the image. Please ensure it's a valid format and try again.";
    }
}


export async function getInitialAnalysis(company: Company, agentMode: 'dalio' | 'quant'): Promise<{analysisText: string, citations: any[]}> {
    const dalioPrompt = `
        You are an AI investment agent embodying Ray Dalio's principles. Your task is to analyze ${company.name} (${company.ticker}) using up-to-date information from the web.

        Company Profile:
        - R&D Pipeline: ${company.pipeline}
        - Market Cap: ${company.marketCap}
        
        Task:
        1.  **Synthesize Facts:** Summarize the key facts about the company's current standing, recent news, and major upcoming catalysts based on search results.
        2.  **Dalio's Principles:** Analyze the situation considering principles like 'radical open-mindedness' and 'stress-testing'. What are the primary risks and opportunities? How would this fit into a diversified portfolio?

        Present your analysis in well-structured Markdown format. Be objective and data-driven, citing your sources.
    `;
    
    const quantPrompt = `
        You are a quantitative analyst. Your task is to provide a data-driven analysis of ${company.name} (${company.ticker}) using real-time web data.

        Company Profile:
        - R&D Pipeline: ${company.pipeline}
        - Market Cap: ${company.marketCap}

        Task:
        1.  **Signal Synthesis:** Process web search results to create a 'Quant Signal Summary'. This should be a neutral, data-driven summary highlighting current market sentiment, recent price action, volatility indicators, and any announced catalyst dates.
        2.  **Initial Assessment:** Based on the signal summary, provide a brief, high-level quantitative assessment.

        Present your analysis in a concise, professional Markdown format.
    `;

    try {
        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: agentMode === 'dalio' ? dalioPrompt : quantPrompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        const analysisText = response.text;
        const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        return { analysisText, citations };
    } catch (error) {
        console.error("Error fetching initial analysis from Gemini:", error);
        const errorResult = {
            analysisText: "Error: Could not retrieve analysis. Please check your API key and network connection.",
            citations: []
        };
        return errorResult;
    }
}

const strategySchema = {
    type: Type.OBJECT,
    properties: {
      strategyName: { type: Type.STRING },
      strategyType: { type: Type.STRING },
      ticker: { type: Type.STRING },
      analysis: { type: Type.STRING },
      rationale: { 
          type: Type.OBJECT,
          properties: {
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["keyPoints", "riskConsiderations"]
      },
      greeks: {
          type: Type.OBJECT,
          properties: {
              delta: { type: Type.NUMBER },
              theta: { type: Type.NUMBER },
              vega: { type: Type.NUMBER },
          },
          required: ["delta", "theta", "vega"],
      },
      tradeDetails: {
        type: Type.OBJECT,
        properties: {
          legs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                type: { type: Type.STRING },
                strike: { type: Type.NUMBER },
                expiry: { type: Type.STRING },
              },
               required: ["action", "type", "strike", "expiry"],
            },
          },
          entryPrice: { type: Type.STRING },
          targetProfit: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          positionSize: { type: Type.STRING },
          maxRisk: { type: Type.STRING },
        },
        required: ["legs", "entryPrice", "targetProfit", "stopLoss", "positionSize", "maxRisk"],
      },
    },
    required: ["strategyName", "ticker", "analysis", "rationale", "greeks", "tradeDetails"],
};

const formatOptionsChainForPrompt = (chain: OptionsChain) => {
    const format = (options: any[]) => options.map(o => 
        `K=${o.strike} IV=${o.iv.toFixed(1)}% B/A=$${o.bid.toFixed(2)}/$${o.ask.toFixed(2)} V=${o.volume}`
    ).join('; ');
    return `Calls: ${format(chain.calls)}\nPuts: ${format(chain.puts)}`;
};


export async function getDalioStrategy(company: Company, mockData: MockData, initialCapital: number): Promise<ProposedStrategy | null> {
    
    const prompt = `
        Continuing your analysis of ${company.name} (${company.ticker}) as Ray Dalio, you have been provided with the following simulated financial data and portfolio constraints:
        - Portfolio Capital: $${initialCapital.toLocaleString()}
        - Current Stock Price: $${mockData.stockPrice.toFixed(2)}
        - Upcoming Catalyst Date (Trial Results): ${mockData.catalystDate}
        - Live Options Chain Data:
          ${formatOptionsChainForPrompt(mockData.optionsChain)}

        The high Implied Volatility indicates the market is pricing in a significant price move. Your task is to find a statistical arbitrage opportunity based on a potential dislocation in this implied volatility.

        1. **Volatility Analysis:** Briefly explain the implied volatility dislocation you see based on the detailed chain data.
        2. **Strategy Proposal:** Propose a specific, risk-defined options strategy.
        3. **Position Sizing:** Based on the Portfolio Capital, calculate a position size. Adhere to a strict risk management rule: the maximum potential loss on this trade cannot exceed 2% of the total portfolio capital. Clearly state the number of contracts to trade.
        4. **Risk Analysis:** At the time of trade initiation, calculate the position's estimated Greeks: Delta (stock price sensitivity), Theta (time decay), and Vega (volatility sensitivity).
        5. **Trade Rationale:** Justify your strategy in a structured format with 'keyPoints' and 'riskConsiderations'. Be explicit about why the chosen structure and its Greeks are appropriate for this specific catalyst event.

        Output ONLY a single, valid JSON object matching the exact schema provided. Do not include any other text or markdown formatting.
    `;

    const { strategyType, ...dalioProperties } = strategySchema.properties;
    const dalioRequired = strategySchema.required.filter(r => r !== 'strategyType');

    const dalioSchema = {
        ...strategySchema,
        properties: dalioProperties,
        required: dalioRequired
    };

    let response: GenerateContentResponse | undefined;

    try {
        response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dalioSchema
            },
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ProposedStrategy;
    } catch (error) {
        console.error("Error fetching strategy from Gemini:", error);
        if (response) console.error("Raw response text:", response.text);
        return null;
    }
}

export async function getQuantStrategies(company: Company, mockData: MockData, initialCapital: number): Promise<ProposedStrategy[] | null> {
    
    const prompt = `
        You are the head of a quantitative trading desk. Your systems have ingested data for ${company.name} (${company.ticker}) and must formulate arbitrage strategies.

        Portfolio & Market Data:
        - Total Portfolio Capital: $${initialCapital.toLocaleString()}
        - Current Stock Price: $${mockData.stockPrice.toFixed(2)}
        - Upcoming Catalyst Date (Trial Results): ${mockData.catalystDate}
        - Live Options Chain Data:
          ${formatOptionsChainForPrompt(mockData.optionsChain)}

        Your Task:
        Analyze this granular data to identify multiple, distinct statistical arbitrage opportunities. For each opportunity, formulate a precise, actionable trading strategy. For each strategy, you MUST calculate a position size (number of contracts) that ensures the maximum potential loss does not exceed 2% of the Total Portfolio Capital. You must also calculate the initial Greeks (Delta, Theta, Vega) and provide a structured rationale ('keyPoints' and 'riskConsiderations').

        Generate strategies for these categories:
        1.  **Volatility Arbitrage:** A strategy that profits from the difference between implied and expected realized volatility (e.g., Short Straddle, Strangles).
        2.  **Skew Arbitrage:** A strategy that takes advantage of the steepness of the volatility skew (e.g., Risk Reversal, Collar).
        3.  **Risk-Defined Speculation:** A risk-defined directional or volatility bet (e.g., Iron Condor, Butterfly Spread).

        Output ONLY a single, valid JSON array of objects. Do not include any other text or markdown formatting. Each object in the array must match the exact specified schema.
    `;
    
    const responseSchema = {
        type: Type.ARRAY,
        items: strategySchema
      };

    let response: GenerateContentResponse | undefined;
    try {
        response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            },
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ProposedStrategy[];
    } catch (error) {
        console.error("Error fetching quant strategies from Gemini:", error);
        if (response) console.error("Raw response text:", response.text);
        return null;
    }
}

export async function getOptimizedStrategy(
    initialStrategy: ProposedStrategy,
    backtest: FullBacktest,
    company: Company,
    initialCapital: number
): Promise<ProposedStrategy | null> {
    const backtestResult = backtest.results;
    const summary = `
      - Final P/L: ${backtestResult[backtestResult.length - 1].profitLoss.toFixed(2)}%
      - Sharpe Ratio: ${backtest.metrics.sharpeRatio.toFixed(2)}
      - Alpha: ${backtest.metrics.alpha.toFixed(2)}
      - P/L at Catalyst Day (Day 20): ${backtestResult.find(r => r.ohlcv.day === 20)?.profitLoss.toFixed(2)}%
    `;

    const prompt = `
        You are a senior quantitative analyst at a hedge fund, using AI to optimize an options strategy based on its simulated backtest performance.

        Initial Strategy Details:
        - Company: ${company.name} (${company.ticker})
        - Strategy Name: ${initialStrategy.strategyName}
        - Structure: ${JSON.stringify(initialStrategy.tradeDetails.legs)}

        Simulated Backtest Performance Summary:
        ${summary}
        The backtest simulated 30 days of trading, with a major catalyst event on Day 20 causing a large price shock and a significant "volatility crush" (drop in implied volatility).

        Your Task:
        1.  **Analyze Performance:** Briefly explain WHY the strategy performed as it did, according to the backtest summary. Did it suffer from high theta decay? Was it negatively impacted by the volatility crush? Was it not properly hedged?
        2.  **Propose Optimized Strategy:** Based on your analysis, propose a NEW, optimized strategy. You can adjust strike prices, change the strategy type (e.g., from a Straddle to a risk-defined Iron Condor), or modify legs to improve the risk/reward profile.
        3.  **Recalculate Position Size & Greeks:** Using the same portfolio capital of $${initialCapital.toLocaleString()} and the 2% max risk rule, calculate the new position size for your optimized strategy and its initial Greeks (Delta, Theta, Vega).
        4.  **Justify Changes:** Provide a structured rationale ('keyPoints', 'riskConsiderations') explaining why your proposed changes lead to a superior strategy, specifically referencing the backtest results.

        Output ONLY a single, valid JSON object matching the required schema. The new strategy MUST be demonstrably different from the initial one. The 'strategyName' should reflect the optimization (e.g., "Optimized Iron Condor").
    `;

    let response: GenerateContentResponse | undefined;
    try {
        response = await generateContentWithRetry({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: strategySchema,
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ProposedStrategy;
    } catch (error) {
        console.error("Error fetching optimized strategy from Gemini:", error);
        if (response) console.error("Raw response text:", response.text);
        return null;
    }
}

// --- Company Search Service ---
const companySearchSchema = {
    type: Type.OBJECT,
    properties: {
        ticker: { type: Type.STRING },
        name: { type: Type.STRING },
        domain: { type: Type.STRING, description: "The company's main website domain, e.g., 'apple.com'" },
        pipeline: { type: Type.STRING, description: "A brief description of the company's core business, products, or R&D focus." },
        sector: { type: Type.STRING, description: "The company's primary market sector, e.g., 'Technology', 'Biotechnology', 'Healthcare'." },
    },
    required: ["ticker", "name", "domain", "pipeline", "sector"],
};

const companyListSearchSchema = {
    type: Type.ARRAY,
    items: companySearchSchema
};

export async function searchCompanies(query: string): Promise<Omit<Company, 'marketCap'>[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const prompt = `
        You are a financial data API. The user is searching for a stock.
        Based on the user's search query: "${query}", find up to 7 matching publicly traded companies on major US exchanges (NYSE, NASDAQ).

        For each company, provide:
        - Ticker symbol.
        - Official company name.
        - The company's main website domain (e.g., 'nvidia.com').
        - A brief, one-sentence description of its core business for the 'pipeline'.
        - Its primary market sector.

        Return the results as a single, valid JSON array of objects. If you find no results, return an empty array.
    `;

    try {
        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: companyListSearchSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Omit<Company, 'marketCap'>[];
    } catch (error) {
        console.error("Error searching for companies:", error);
        return [];
    }
}


// --- Opportunity Scanner Service ---

const opportunitySchema = {
    type: Type.OBJECT,
    properties: {
        ticker: { type: Type.STRING },
        name: { type: Type.STRING },
        rationale: { type: Type.STRING, description: "Why this company is a good candidate for a calendar spread." },
        catalystDate: { type: Type.STRING, description: "The date of the upcoming catalyst, e.g., earnings report." },
    },
    required: ["ticker", "name", "rationale", "catalystDate"],
};

const opportunityListSchema = {
    type: Type.ARRAY,
    items: opportunitySchema
};

export async function scanForCalendarSpreadOpportunities(): Promise<Opportunity[]> {
    const prompt = `
        You are an AI market analyst. Your task is to scan the market for companies that are prime candidates for a long call calendar spread.
        The criteria for a good candidate are:
        1.  An upcoming, known catalyst event within the next 30 days (e.g., earnings report, FDA decision). This will cause a spike in near-term implied volatility (IV).
        2.  A steep volatility term structure, preferably in backwardation (near-term IV is higher than long-term IV).
        3.  The stock is expected to be relatively range-bound or have a predictable move around the catalyst. Highly volatile, unpredictable stocks are less ideal.
        
        Use Google Search to find at least 5 companies that currently fit these criteria.
        
        For each company, provide:
        - The stock ticker.
        - The company name.
        - A brief, compelling rationale explaining why it meets the criteria (mention the catalyst and date).
        - The catalyst date.

        Return the results as a single, valid JSON array of objects.
    `;

    try {
        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: opportunityListSchema
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Opportunity[];
    } catch (error) {
        console.error("Error scanning for opportunities:", error);
        return [];
    }
}


// --- Audio Transcription Service ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createAudioBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

export async function initiateTranscription(onTranscriptionUpdate: (text: string) => void): Promise<LiveSession> {
    let currentTranscription = '';

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Transcription session opened.'),
            onmessage: (message) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentTranscription += text;
                    onTranscriptionUpdate(currentTranscription);
                }
                if (message.serverContent?.turnComplete) {
                    currentTranscription = '';
                }
            },
            onerror: (e) => console.error('Transcription error:', e),
            onclose: () => console.log('Transcription session closed.'),
        },
        config: {
            responseModalities: [Modality.AUDIO], // Required by the API
            inputAudioTranscription: {},
        },
    });

    return sessionPromise;
}