import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// TypeScript 타입 정의 추가
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const recognitionRef = useRef<any>(null);
  const textContainerRef = useRef<HTMLParagraphElement>(null);

  // 음성 안내 메시지 재생 함수
  const playWelcomeMessage = async () => {
    try {
      const welcomeText = "무엇을 주문하시겠어요?";
      const ttsResponse = await axios.post(
        'http://localhost:3001/api/text-to-speech', 
        { text: welcomeText },
        { responseType: 'arraybuffer' }
      );
      
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(ttsResponse.data);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      // 음성 안내가 끝나면 음성 인식 시작
      source.onended = () => {
        startVoiceRecognition();
      };
    } catch (error) {
      console.error('Error playing welcome message:', error);
    }
  };

  // 가격 음성 응답 재생 함수
  const playPriceResponse = async (responseText: string) => {
    try {
      const ttsResponse = await axios.post(
        'http://localhost:3001/api/text-to-speech',
        { text: responseText },
        { responseType: 'arraybuffer' }
      );

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(ttsResponse.data);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      // 가격 안내가 끝나면 녹음 중지
      source.onended = () => {
        stopRecording();
      };
    } catch (error) {
      console.error('Error playing price response:', error);
    }
  };

  // 음성 인식 시작 함수
  const startVoiceRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ko-KR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const text = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setRecordedText(text);

        // 주문 텍스트에서 상품명 추출
        const productName = text.replace('주문', '').trim();
        
        try {
          // 상품 검색 요청
          const searchResponse = await axios.get(
            `http://localhost:3001/api/products/search?name=${productName}`
          );

          if (searchResponse.data.length > 0) {
            const product = searchResponse.data[0];
            const responseText = `제품의 가격은 ${product.c_price}원 입니다.`;
            await playPriceResponse(responseText);
          } else {
            await playPriceResponse("죄송합니다. 해당 제품을 찾을 수 없습니다.");
          }
        } catch (error) {
          console.error('Error searching product:', error);
        }
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    await playWelcomeMessage();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setRecordedText('');
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? '녹음 중지' : '음성 인식 시작'}
      </button>
      <p ref={textContainerRef}>
        {recordedText && `인식된 텍스트: ${recordedText}`}
      </p>
    </div>
  );
};

export default VoiceRecognition;