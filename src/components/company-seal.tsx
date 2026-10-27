export function CompanySeal({
  company = "codeInt",
  suffix = "seal",
  size = 108,
  className = "",
  style = {},
}: {
  company?: string;
  suffix?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const topId = `sTop-${suffix}`;
  const botId = `sBot-${suffix}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: "rotate(-7deg)",
        opacity: 0.92,
        flexShrink: 0,
        ...style,
      }}
    >
      <defs>
        {/* Top arc: left to right across the top */}
        <path id={topId} d="M 22 100 A 78 78 0 0 1 178 100" />
        {/* Bottom arc: right to left across the bottom */}
        <path id={botId} d="M 178 100 A 78 78 0 0 1 22 100" />
      </defs>

      {/* Outer solid ring */}
      <circle cx="100" cy="100" r="95" stroke="#C2410C" strokeWidth="2.5" />

      {/* Inner dashed track */}
      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="#EA580C"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Inner solid border */}
      <circle cx="100" cy="100" r="76" stroke="#C2410C" strokeWidth="1" />

      {/* Top curved company name */}
      <text
        fill="#C2410C"
        fontSize="12.5"
        fontWeight="800"
        letterSpacing="3"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      >
        <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
          ★ CODEINT TECHNOLOGIES ★
        </textPath>
      </text>

      {/* Bottom curved text */}
      <text
        fill="#C2410C"
        fontSize="10"
        fontWeight="600"
        letterSpacing="2.5"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      >
        <textPath href={`#${botId}`} startOffset="50%" textAnchor="middle">
          VERIFIED &amp; AUTHORIZED
        </textPath>
      </text>

      {/* Center FULL NAME: codeInt (written explicitly as requested) */}
      <text
        x="100"
        y="96"
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        letterSpacing="-0.5"
      >
        <tspan fill="#0F172A">code</tspan>
        <tspan fill="#EA580C">Int</tspan>
      </text>

      {/* Center Subtitle */}
      <text
        x="100"
        y="115"
        textAnchor="middle"
        fill="#C2410C"
        fontSize="8"
        fontWeight="700"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        letterSpacing="2"
      >
        OFFICIAL SEAL
      </text>

      {/* Subtle divider */}
      <line
        x1="68"
        y1="122"
        x2="132"
        y2="122"
        stroke="#EA580C"
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}
