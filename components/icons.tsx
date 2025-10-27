
import React from 'react';

export const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

export const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

export const DocumentChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v11.25C1.5 17.16 2.34 18 3.375 18H9.75v1.5H6.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5h-3v-1.5h6.375c1.035 0 1.875-.84 1.875-1.875V4.875C22.5 3.839 21.66 3 20.625 3H3.375zM9 6.75h6.75a.75.75 0 010 1.5H9a.75.75 0 010-1.5zm0 3h6.75a.75.75 0 010 1.5H9a.75.75 0 010-1.5zm0 3h6.75a.75.75 0 010 1.5H9a.75.75 0 010-1.5z" clipRule="evenodd" />
    </svg>
);

export const ChatBubbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
    </svg>
);

export const PaperclipIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 117.44 9.56l3.45-3.55a.75.75 0 111.061 1.06l-3.45 3.55a1.125 1.125 0 001.591 1.59l3.455-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
    </svg>
);

export const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
);

export const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M3.105 3.105a.75.75 0 01.814-.156l14.692 4.897a.75.75 0 010 1.308L3.919 14.05a.75.75 0 01-1.01-.814l1.964-6.195-1.964-6.195a.75.75 0 01.2-.94z" />
    </svg>
);

export const PositionSizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M8.433 7.418c.158-.103.346-.195.552-.257C9.236 6.94 9.614 6.75 10 6.75c.386 0 .764.19 1.015.41a.522.522 0 01.552.257c.103.158.195.346.257.552C11.94 8.764 12.25 9.142 12.25 9.5c0 .386-.19.764-.41 1.015a.522.522 0 01-.257.552c-.158.103-.346.195-.552.257C10.764 11.44 10.386 11.75 10 11.75c-.386 0-.764-.19-1.015-.41a.522.522 0 01-.552-.257c-.103-.158-.195-.346-.257-.552C8.06 9.236 7.75 8.858 7.75 8.5c0-.386.19-.764.41-1.015a.522.522 0 01.257-.552z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
    </svg>
);

export const RiskIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 1.562.323 3.036.89 4.343.567 1.307 1.348 2.457 2.299 3.407a.75.75 0 001.06 0l.1-.1a.75.75 0 000-1.06l-1.06-1.06a.75.75 0 010-1.06l1.06-1.06a.75.75 0 000-1.06l-1.06-1.06a.75.75 0 00-1.06 0l-.1.1a.75.75 0 000 1.06l.82.82a6.445 6.445 0 00-1.625.66A4.5 4.5 0 015.5 7c0-.98.422-1.867 1.087-2.522a4.5 4.5 0 012.413-1.423A4.5 4.5 0 0110 3c.832 0 1.612.223 2.278.622a4.5 4.5 0 012.135 2.135A4.5 4.5 0 0114.5 9c0 .773-.29 1.485-.769 2.022a4.49 4.49 0 01-1.002 1.002A4.5 4.5 0 0110 13a4.5 4.5 0 01-2.278-.622 4.5 4.5 0 01-2.135-2.135A4.5 4.5 0 015.5 9a.75.75 0 00-1.5 0c0 .98.422 1.867 1.087 2.522a6 6 0 107.826-7.826A6 6 0 0010 1.944z" clipRule="evenodd" />
    </svg>
);

export const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10 3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 6a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM11.5 11a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" />
    </svg>
);

export const StopLossIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

export const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5 4.5A2.5 2.5 0 017.5 2h5A2.5 2.5 0 0115 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 015 15.5v-11z" />
        <path d="M6 5.25a.75.75 0 000 1.5h8a.75.75 0 000-1.5H6zM6.75 9a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zM6 12.25a.75.75 0 000 1.5h8a.75.75 0 000-1.5H6z" />
    </svg>
);

export const VaultIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18 8.25c0-.414-.336-.75-.75-.75h-2.5a.75.75 0 000 1.5h2.5a.75.75 0 00.75-.75zM18 11.25c0 .414-.336-.75-.75-.75h-2.5a.75.75 0 000 1.5h2.5a.75.75 0 00.75-.75z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0-2a4 4 0 00-4 4v8a4 4 0 004 4h12a4 4 0 004-4V6a4 4 0 00-4-4H4z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);

export const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M9.25 11.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75z" />
        <path fillRule="evenodd" d="M4.5 3.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.25 5h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 010-1.5zM4.5 8.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.25 10h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 010-1.5zM4.5 13.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.25 15h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 010-1.5z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M15.5 2.5a.75.75 0 00-1.06-.02L12.91 4H11.5a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75h3.75a.75.75 0 00.75-.75V8.41l1.53 1.53a.75.75 0 001.06-1.06l-3-3a.75.75 0 00-1.06 0l-.97.97V5.09l1.53-1.53A.75.75 0 0015.5 2.5z" clipRule="evenodd" />
    </svg>
);

export const MicrophoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path d="M5.5 8.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V9a.5.5 0 01.5-.5z" />
        <path d="M10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" />
    </svg>
);

export const MicrophoneSlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" />
        <path d="M13 4.843A3.003 3.003 0 007 4v6a3 3 0 005.157 2.157.5.5 0 01.707.707A4.002 4.002 0 016 10V4a4 4 0 018 0v.293a.5.5 0 01-.854.353L13 4.843z" />
        <path fillRule="evenodd" d="M3.646 3.646a.5.5 0 01.708 0l12 12a.5.5 0 01-.708.708l-12-12a.5.5 0 010-.708z" clipRule="evenodd" />
    </svg>
);

export const RadarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10 5.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" />
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM1.5 10a8.5 8.5 0 1117 0 8.5 8.5 0 01-17 0z" />
        <path d="M10 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0110 1.5z" />
    </svg>
);

const GreekIcon: React.FC<{ letter: string } & React.SVGProps<SVGSVGElement>> = ({ letter, ...props }) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
            {letter}
        </text>
    </svg>
);
export const DeltaIcon = (props: React.SVGProps<SVGSVGElement>) => <GreekIcon letter="Δ" {...props} />;
export const ThetaIcon = (props: React.SVGProps<SVGSVGElement>) => <GreekIcon letter="Θ" {...props} />;
export const VegaIcon = (props: React.SVGProps<SVGSVGElement>) => <GreekIcon letter="V" {...props} />;