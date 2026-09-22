import React from 'react';

export interface PelangiLogoProps {
  className?: string;
  height?: number | string;
  variant?: 'horizontal' | 'vertical' | 'icon';
  showText?: boolean;
}

/**
 * Komponen Vektor Resmi Logo Pelangi Lazuardi
 * Menampilkan lambang perisai dengan lengkungan pelangi (merah, jingga, hijau),
 * figur ananda & buku terbuka, serta tipografi serif Pelangi Lazuardi.
 * Mendukung format horizontal, vertikal (seperti logo.png), maupun ikon perisai.
 */
export const PelangiLogo: React.FC<PelangiLogoProps> = ({
  className = 'h-10',
  height,
  variant = 'horizontal',
  showText = true,
}) => {
  const isVertical = variant === 'vertical';
  const isIcon = variant === 'icon' || !showText;

  // Render Perisai Pelangi Lazuardi
  const renderShield = () => (
    <g id="shield-emblem">
      {/* Latar Putih Perisai */}
      <path
        d="M85 8 C105 8 148 4 156 15 C159 27 159 105 159 116 C159 152 124 178 85 194 C46 178 11 152 11 116 C11 105 11 27 14 15 C22 4 65 8 85 8 Z"
        fill="#FFFFFF"
      />
      {/* Garis Luar Perisai Biru Lazuardi */}
      <path
        d="M85 8 C105 8 148 4 156 15 C159 27 159 105 159 116 C159 152 124 178 85 194 C46 178 11 152 11 116 C11 105 11 27 14 15 C22 4 65 8 85 8 Z"
        stroke="#214F9B"
        strokeWidth="9.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Lengkungan Pelangi 1: Merah (Luar) */}
      <path
        d="M31 93 A 54 54 0 0 1 139 93"
        stroke="#E32626"
        strokeWidth="11"
        strokeLinecap="butt"
        fill="none"
      />
      {/* Lengkungan Pelangi 2: Kuning / Oranye (Tengah) */}
      <path
        d="M42 93 A 43 43 0 0 1 128 93"
        stroke="#F58220"
        strokeWidth="10.5"
        strokeLinecap="butt"
        fill="none"
      />
      {/* Lengkungan Pelangi 3: Hijau (Dalam) */}
      <path
        d="M52.5 93 A 32.5 32.5 0 0 1 117.5 93"
        stroke="#0FA958"
        strokeWidth="10"
        strokeLinecap="butt"
        fill="none"
      />

      {/* Kepala Figur Ananda (Lingkaran Biru) */}
      <circle cx="85" cy="103" r="14.5" fill="#214F9B" />

      {/* Sayap / Buku Terbuka (Figur Tubuh Biru) */}
      {/* Sayap Kiri */}
      <path
        d="M85 178 C83 145 52 126 36 122 C36 142 46 168 85 178 Z"
        fill="#214F9B"
      />
      {/* Sayap Kanan */}
      <path
        d="M85 178 C87 145 118 126 134 122 C134 142 124 168 85 178 Z"
        fill="#214F9B"
      />
    </g>
  );

  if (isIcon) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <svg
          viewBox="0 0 170 200"
          className="h-full w-auto max-h-full"
          style={height ? { height } : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Logo Pelangi Lazuardi"
        >
          {renderShield()}
        </svg>
      </div>
    );
  }

  if (isVertical) {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <svg
          viewBox="0 0 170 280"
          className="h-full w-auto max-h-full"
          style={height ? { height } : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Logo Pelangi Lazuardi"
        >
          {renderShield()}
          <g id="brand-text-vertical" fill="#28292E">
            <text
              x="85"
              y="234"
              textAnchor="middle"
              fontFamily="'Georgia', 'Times New Roman', 'Merriweather', serif"
              fontSize="45"
              fontWeight="900"
              letterSpacing="-0.5"
            >
              Pelangi
            </text>
            <text
              x="85"
              y="273"
              textAnchor="middle"
              fontFamily="'Georgia', 'Times New Roman', 'Merriweather', serif"
              fontSize="43"
              fontWeight="900"
              letterSpacing="-0.5"
            >
              Lazuardi
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Horizontal default
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 520 200"
        className="h-full w-auto max-h-full"
        style={height ? { height } : undefined}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo Pelangi Lazuardi"
      >
        {renderShield()}
        <g id="brand-text-horizontal" fill="#28292E">
          <text
            x="185"
            y="92"
            fontFamily="'Georgia', 'Times New Roman', 'Merriweather', serif"
            fontSize="78"
            fontWeight="900"
            letterSpacing="-1"
          >
            Pelangi
          </text>
          <text
            x="185"
            y="172"
            fontFamily="'Georgia', 'Times New Roman', 'Merriweather', serif"
            fontSize="78"
            fontWeight="900"
            letterSpacing="-1"
          >
            Lazuardi
          </text>
        </g>
      </svg>
    </div>
  );
};
