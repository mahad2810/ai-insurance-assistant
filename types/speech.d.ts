// Web Speech API type definitions
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: (this: SpeechRecognition, ev: Event) => any;
  onaudioend: (this: SpeechRecognition, ev: Event) => any;
  onend: (this: SpeechRecognition, ev: Event) => any;
  onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
  onnomatch: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  onsoundstart: (this: SpeechRecognition, ev: Event) => any;
  onsoundend: (this: SpeechRecognition, ev: Event) => any;
  onspeechstart: (this: SpeechRecognition, ev: Event) => any;
  onspeechend: (this: SpeechRecognition, ev: Event) => any;
  onstart: (this: SpeechRecognition, ev: Event) => any;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechGrammarList {
  readonly length: number
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
}

interface SpeechGrammar {
  src: string
  weight: number
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

// Make this a module
export {}
