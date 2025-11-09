// src/components/AiStarsIcon.jsx
export default function AiStarsIcon({ size = 34 }) {
  return (
    <span className="inline-block align-middle relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
        <g>
          <circle className="ai-star1" cx="8" cy="11" r="2" fill="#8a3ffc" />
          <circle className="ai-star2" cx="26" cy="13" r="1.2" fill="#ff930f" />
          <circle className="ai-star3" cx="15" cy="25" r="1.5" fill="#54aaff" />
          <polygon className="ai-star4" points="23,5 24,8 27,8 24.5,10 25.5,13 23,11.5 20.5,13 21.5,10 19,8 22,8" fill="#e83ffb" />
        </g>
      </svg>
      <style>{`
        .ai-star1 { animation: star-float1 2.5s infinite ease-in-out; }
        .ai-star2 { animation: star-float2 2.2s infinite ease-in-out; }
        .ai-star3 { animation: star-float3 2.7s infinite ease-in-out; }
        .ai-star4 { animation: star-float4 3.1s infinite ease-in-out; }
        @keyframes star-float1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.2); }
        }
        @keyframes star-float2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(3px) scale(0.8); }
        }
        @keyframes star-float3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.1); }
        }
        @keyframes star-float4 {
          0%, 100% { transform: translate(0,0) scale(1);}
          50% { transform: translate(-2px,2px) scale(1.14);}
        }
      `}</style>
    </span>
  );
}
