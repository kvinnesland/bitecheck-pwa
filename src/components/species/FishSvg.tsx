const SVG_PROPS = {
  viewBox: '0 0 160 80',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Torsk() {
  return (
    <svg {...SVG_PROPS}>
      {/* Body */}
      <path d="M30 40 Q50 20 100 30 Q120 34 130 40 Q120 46 100 50 Q50 60 30 40Z" />
      {/* Tail */}
      <path d="M130 40 L148 28 M130 40 L148 52" />
      {/* Chin barbel */}
      <path d="M30 42 Q28 48 27 52" />
      {/* Dorsal fin 1 */}
      <path d="M55 28 Q65 14 75 26" />
      {/* Dorsal fin 2 */}
      <path d="M78 26 Q86 15 94 26" />
      {/* Dorsal fin 3 */}
      <path d="M96 28 Q104 18 112 28" />
      {/* Anal fin 1 */}
      <path d="M75 52 Q82 64 90 52" />
      {/* Anal fin 2 */}
      <path d="M95 50 Q101 60 107 50" />
      {/* Pectoral fin */}
      <path d="M55 38 Q60 48 65 42" />
      {/* Eye */}
      <circle cx="36" cy="38" r="3" />
      {/* Lateral line */}
      <path d="M50 36 Q90 38 125 40" strokeDasharray="3 3" />
    </svg>
  );
}

function Kveite() {
  return (
    <svg {...SVG_PROPS}>
      {/* Flat oval body, wide orientation */}
      <ellipse cx="75" cy="40" rx="55" ry="26" />
      {/* Tail fin */}
      <path d="M128 34 L148 24 M128 46 L148 56 M128 34 L128 46" />
      {/* Top fin (dorsal) runs along top edge */}
      <path d="M30 30 Q75 10 120 32" />
      {/* Bottom fin (anal) */}
      <path d="M40 50 Q80 66 118 48" />
      {/* Wavy lateral line */}
      <path d="M40 38 Q60 34 80 40 Q100 46 120 40" />
      {/* Eyes on top side */}
      <circle cx="32" cy="35" r="3" />
      <circle cx="38" cy="30" r="2.5" />
      {/* Snout */}
      <path d="M22 40 Q18 38 20 42" />
    </svg>
  );
}

function Sei() {
  return (
    <svg {...SVG_PROPS}>
      {/* Streamlined body */}
      <path d="M25 40 Q45 24 100 32 Q120 35 132 40 Q120 45 100 48 Q45 56 25 40Z" />
      {/* Deeply forked tail */}
      <path d="M132 40 L150 25 M132 40 L150 55" />
      {/* Single dorsal fin */}
      <path d="M60 30 Q80 14 100 30" />
      {/* Anal fin */}
      <path d="M80 48 Q90 60 100 48" />
      {/* Pectoral fin */}
      <path d="M52 38 Q58 50 64 42" />
      {/* Eye */}
      <circle cx="32" cy="38" r="3" />
      {/* Curved lateral line */}
      <path d="M50 36 Q90 36 128 40" />
    </svg>
  );
}

function Hyse() {
  return (
    <svg {...SVG_PROPS}>
      {/* Slimmer body */}
      <path d="M28 40 Q50 24 100 31 Q118 34 130 40 Q118 46 100 49 Q50 56 28 40Z" />
      {/* Tail */}
      <path d="M130 40 L148 27 M130 40 L148 53" />
      {/* Black shoulder spot */}
      <circle cx="55" cy="36" r="4" fill="currentColor" stroke="none" />
      {/* Barbel */}
      <path d="M28 42 Q26 48 25 52" />
      {/* Dorsal fin 1 */}
      <path d="M58 28 Q70 14 82 28" />
      {/* Dorsal fin 2 */}
      <path d="M84 28 Q94 16 104 28" />
      {/* Dark lateral line */}
      <path d="M48 36 Q88 34 126 40" strokeWidth="2" />
      {/* Anal fin */}
      <path d="M78 50 Q88 62 98 50" />
      {/* Pectoral fin */}
      <path d="M52 38 Q58 50 64 42" />
      {/* Eye */}
      <circle cx="34" cy="37" r="3" />
    </svg>
  );
}

function Lange() {
  return (
    <svg {...SVG_PROPS}>
      {/* Very elongated body */}
      <path d="M18 40 Q30 30 120 35 Q136 36 142 40 Q136 44 120 45 Q30 50 18 40Z" />
      {/* Rounded tail */}
      <path d="M142 36 Q152 40 142 44" />
      {/* Long dorsal fin 1 (front) */}
      <path d="M40 32 Q55 20 70 32" />
      {/* Long dorsal fin 2 (runs most of back) */}
      <path d="M72 32 Q100 22 130 34" />
      {/* Anal fin long */}
      <path d="M80 46 Q105 56 128 45" />
      {/* Pectoral */}
      <path d="M38 38 Q42 48 48 42" />
      {/* Eye */}
      <circle cx="24" cy="38" r="2.5" />
      {/* Barbel */}
      <path d="M18 42 Q16 48 15 52" />
    </svg>
  );
}

function Brosme() {
  return (
    <svg {...SVG_PROPS}>
      {/* Elongated body */}
      <path d="M20 40 Q35 28 110 34 Q130 36 140 40 Q130 44 110 46 Q35 52 20 40Z" />
      {/* Rounded tail */}
      <path d="M140 36 Q152 40 140 44" />
      {/* Single very long dorsal fin running most of back */}
      <path d="M40 30 Q75 16 125 34" />
      {/* Long anal fin */}
      <path d="M70 47 Q100 58 125 46" />
      {/* Pectoral */}
      <path d="M38 38 Q43 50 50 42" />
      {/* Single barbel */}
      <path d="M20 43 Q18 50 17 55" />
      {/* Eye */}
      <circle cx="26" cy="38" r="3" />
    </svg>
  );
}

function Uer() {
  return (
    <svg {...SVG_PROPS}>
      {/* Large angular head ~1/3 body */}
      <path d="M20 40 Q22 22 50 26 Q70 26 90 30 Q110 32 128 40 Q110 50 90 52 Q70 54 50 56 Q22 58 20 40Z" />
      {/* Spiny angular head outline */}
      <path d="M20 40 Q22 22 50 26" />
      {/* Tail */}
      <path d="M128 40 L144 30 M128 40 L144 50" />
      {/* Big eye */}
      <circle cx="38" cy="36" r="6" />
      <circle cx="38" cy="36" r="3" fill="currentColor" stroke="none" />
      {/* Spiny dorsal fin */}
      <path d="M52 26 L56 12 L62 24 L68 10 L74 24 L80 14 L86 28 Q100 22 115 30" />
      {/* Fan-like pectoral */}
      <path d="M52 44 Q48 60 62 58 Q70 56 68 44" />
      {/* Anal fin */}
      <path d="M88 52 Q96 64 104 52" />
      {/* Spiny operculum */}
      <path d="M40 26 L36 22" />
      <path d="M44 24 L42 18" />
    </svg>
  );
}

function Steinbit() {
  return (
    <svg {...SVG_PROPS}>
      {/* Large blocky head 1/3 of body */}
      <path d="M14 40 Q16 22 52 22 Q70 22 80 28 Q110 30 135 38 Q138 40 135 42 Q110 52 80 54 Q70 58 52 58 Q16 58 14 40Z" />
      {/* Blunt snout */}
      <path d="M14 36 Q8 40 14 44" />
      {/* Large mouth */}
      <path d="M14 38 Q20 42 28 38" />
      {/* Teeth hint */}
      <path d="M16 40 L18 43 M20 40 L22 43 M24 39 L26 42" />
      {/* Single long dorsal */}
      <path d="M60 24 Q92 14 125 36" />
      {/* Tail */}
      <path d="M135 38 Q148 40 135 42" />
      {/* Pectoral fan */}
      <path d="M55 44 Q50 58 64 56 Q72 54 70 44" />
      {/* Eye */}
      <circle cx="28" cy="34" r="4" />
      <circle cx="28" cy="34" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Makrell() {
  return (
    <svg {...SVG_PROPS}>
      {/* Torpedo streamlined body */}
      <path d="M22 40 Q35 30 90 33 Q115 34 135 40 Q115 46 90 47 Q35 50 22 40Z" />
      {/* Deeply forked tail */}
      <path d="M135 40 L154 24 M135 40 L154 56" />
      {/* Dorsal fin 1 */}
      <path d="M55 31 Q68 18 82 31" />
      {/* Dorsal fin 2 small */}
      <path d="M84 32 Q90 24 96 32" />
      {/* 5-6 finlets between dorsal and tail */}
      <path d="M100 32 L102 28 M106 33 L108 29 M112 34 L114 30 M118 35 L120 31 M124 37 L126 33" />
      {/* Anal finlets */}
      <path d="M102 48 L104 52 M108 47 L110 51 M114 46 L116 50 M120 44 L122 48" />
      {/* Anal fin */}
      <path d="M84 48 Q90 58 96 48" />
      {/* Curved lateral line */}
      <path d="M45 36 Q80 32 130 40" />
      {/* Pectoral */}
      <path d="M50 38 Q54 48 60 42" />
      {/* Eye */}
      <circle cx="28" cy="38" r="3" />
    </svg>
  );
}

function Rodspette() {
  return (
    <svg {...SVG_PROPS}>
      {/* Flat oval rounder body */}
      <ellipse cx="78" cy="40" rx="52" ry="24" />
      {/* Tail */}
      <path d="M128 36 L146 28 M128 44 L146 52 M128 36 L128 44" />
      {/* Dorsal runs along top */}
      <path d="M34 30 Q78 12 122 34" />
      {/* Anal runs along bottom */}
      <path d="M42 50 Q80 66 120 46" />
      {/* Spotted pattern */}
      <circle cx="60" cy="36" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="78" cy="32" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="95" cy="36" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="70" cy="46" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="88" cy="48" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="108" cy="40" r="2.5" fill="currentColor" stroke="none" opacity="0.6" />
      {/* Eyes */}
      <circle cx="30" cy="36" r="3" />
      <circle cx="36" cy="31" r="2.5" />
      {/* Snout */}
      <path d="M27 40 Q22 40 26 44" />
    </svg>
  );
}

function Lomre() {
  return (
    <svg {...SVG_PROPS}>
      {/* Small oval/circular flat body */}
      <ellipse cx="75" cy="40" rx="42" ry="26" />
      {/* Tail */}
      <path d="M115 36 L132 28 M115 44 L132 52 M115 36 L115 44" />
      {/* Dorsal along top */}
      <path d="M38 28 Q75 12 112 34" />
      {/* Anal along bottom */}
      <path d="M46 52 Q78 66 110 46" />
      {/* Eyes */}
      <circle cx="36" cy="35" r="3" />
      <circle cx="41" cy="30" r="2.5" />
      {/* Snout */}
      <path d="M34 40 Q28 40 32 44" />
    </svg>
  );
}

function Sandflyndre() {
  return (
    <svg {...SVG_PROPS}>
      {/* More elongated flat body */}
      <ellipse cx="78" cy="40" rx="52" ry="20" />
      {/* Tail */}
      <path d="M128 36 L146 28 M128 44 L146 52 M128 36 L128 44" />
      {/* Dorsal runs along top */}
      <path d="M32 28 Q78 12 124 34" />
      {/* Anal runs along bottom */}
      <path d="M40 52 Q80 66 122 46" />
      {/* Eyes */}
      <circle cx="30" cy="36" r="3" />
      <circle cx="36" cy="31" r="2.5" />
      {/* Snout */}
      <path d="M27 40 Q22 40 26 44" />
    </svg>
  );
}

function Sild() {
  return (
    <svg {...SVG_PROPS}>
      {/* Slender compressed herring body */}
      <path d="M24 40 Q40 28 100 32 Q122 34 136 40 Q122 46 100 48 Q40 52 24 40Z" />
      {/* Deeply forked tail */}
      <path d="M136 40 L152 26 M136 40 L152 54" />
      {/* Small single dorsal */}
      <path d="M65 30 Q78 16 90 30" />
      {/* No lateral line (characteristic) */}
      {/* Anal fin */}
      <path d="M95 48 Q105 60 115 48" />
      {/* Pectoral */}
      <path d="M48 38 Q52 50 58 42" />
      {/* Small head, eye */}
      <circle cx="30" cy="38" r="3" />
      {/* Keel hint - dotted belly */}
      <path d="M60 46 Q100 50 130 42" strokeDasharray="2 3" />
    </svg>
  );
}

function Laks() {
  return (
    <svg {...SVG_PROPS}>
      {/* Streamlined salmonid body */}
      <path d="M24 40 Q42 24 95 30 Q116 33 130 40 Q116 47 95 50 Q42 56 24 40Z" />
      {/* Tail slightly hooked lower jaw hint */}
      <path d="M24 40 Q20 42 22 46" />
      {/* Slightly forked tail */}
      <path d="M130 40 L148 28 M130 40 L148 52" />
      {/* Dorsal fin */}
      <path d="M60 27 Q75 12 90 27" />
      {/* Small adipose fin between dorsal and tail */}
      <path d="M108 34 Q114 28 118 34" fill="currentColor" />
      {/* Anal fin */}
      <path d="M88 50 Q96 62 105 50" />
      {/* Pectoral */}
      <path d="M50 38 Q55 50 62 42" />
      {/* Eye */}
      <circle cx="30" cy="37" r="3.5" />
      {/* Spotted body - laks has small x spots */}
      <path d="M65 34 Q66 32 68 34 Q67 36 65 34" fill="currentColor" stroke="none" />
      <path d="M78 32 Q80 30 82 32 Q81 34 78 32" fill="currentColor" stroke="none" />
      <path d="M90 34 Q92 32 94 34 Q93 36 90 34" fill="currentColor" stroke="none" />
      <path d="M70 42 Q72 40 74 42 Q73 44 70 42" fill="currentColor" stroke="none" />
      <path d="M83 44 Q85 42 87 44 Q86 46 83 44" fill="currentColor" stroke="none" />
      {/* Lateral line */}
      <path d="M48 36 Q90 35 126 40" />
    </svg>
  );
}

function Sjoorret() {
  return (
    <svg {...SVG_PROPS}>
      {/* Trout body, shorter and deeper than laks */}
      <path d="M24 40 Q44 22 90 28 Q112 31 128 40 Q112 49 90 52 Q44 58 24 40Z" />
      {/* Square tail */}
      <path d="M128 34 L146 30 L146 50 L128 46" />
      {/* Dorsal fin */}
      <path d="M58 25 Q74 10 88 25" />
      {/* Adipose fin */}
      <path d="M106 32 Q112 26 116 32" fill="currentColor" />
      {/* Anal fin */}
      <path d="M86 52 Q94 64 103 52" />
      {/* Pectoral */}
      <path d="M50 37 Q55 50 62 42" />
      {/* Eye */}
      <circle cx="30" cy="37" r="3.5" />
      {/* Larger spots than laks */}
      <circle cx="66" cy="34" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="80" cy="30" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="94" cy="33" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="74" cy="44" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="88" cy="46" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="104" cy="42" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      {/* Lateral line */}
      <path d="M46 35 Q88 34 124 40" />
    </svg>
  );
}

function Sjotroye() {
  return (
    <svg {...SVG_PROPS}>
      {/* Smaller trout shape */}
      <path d="M26 40 Q44 25 88 30 Q108 33 126 40 Q108 47 88 50 Q44 55 26 40Z" />
      {/* Square tail */}
      <path d="M126 35 L144 31 L144 49 L126 45" />
      {/* Dorsal */}
      <path d="M56 27 Q70 13 84 27" />
      {/* Adipose fin */}
      <path d="M104 33 Q110 27 114 33" fill="currentColor" />
      {/* Anal fin */}
      <path d="M82 51 Q90 62 100 51" />
      {/* Pectoral */}
      <path d="M48 38 Q52 50 58 42" />
      {/* Eye */}
      <circle cx="32" cy="38" r="3" />
      {/* Small round spots */}
      <circle cx="64" cy="35" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="76" cy="32" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="88" cy="35" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="70" cy="44" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="82" cy="46" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
      {/* Lateral line */}
      <path d="M46 36 Q86 35 122 40" />
    </svg>
  );
}

function Orret() {
  return (
    <svg {...SVG_PROPS}>
      {/* Classic brown trout body */}
      <path d="M25 40 Q44 23 90 29 Q112 32 128 40 Q112 48 90 51 Q44 57 25 40Z" />
      {/* Square tail */}
      <path d="M128 34 L146 31 L146 49 L128 46" />
      {/* Dorsal fin */}
      <path d="M57 26 Q72 11 87 26" />
      {/* Adipose fin */}
      <path d="M107 32 Q113 26 117 32" fill="currentColor" />
      {/* Anal fin */}
      <path d="M86 51 Q95 63 104 51" />
      {/* Pectoral */}
      <path d="M50 37 Q55 50 62 42" />
      {/* Eye */}
      <circle cx="31" cy="37" r="3.5" />
      {/* Brown trout spots - mix of sizes */}
      <circle cx="64" cy="34" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="76" cy="30" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="88" cy="33" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="100" cy="36" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="70" cy="44" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="83" cy="46" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="96" cy="44" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      {/* Lateral line */}
      <path d="M46 35 Q88 34 124 40" />
    </svg>
  );
}

function Roye() {
  return (
    <svg {...SVG_PROPS}>
      {/* Deeper body relative to length */}
      <path d="M26 40 Q45 21 86 27 Q107 30 124 40 Q107 50 86 53 Q45 59 26 40Z" />
      {/* Square tail */}
      <path d="M124 34 L142 30 L142 50 L124 46" />
      {/* Dorsal */}
      <path d="M55 24 Q70 10 84 24" />
      {/* Adipose fin */}
      <path d="M103 30 Q109 24 113 30" fill="currentColor" />
      {/* Anal fin */}
      <path d="M82 53 Q90 65 100 53" />
      {/* Pectoral */}
      <path d="M48 38 Q52 52 58 44" />
      {/* Eye */}
      <circle cx="32" cy="37" r="3" />
      {/* Fewer smaller spots */}
      <circle cx="66" cy="34" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="80" cy="30" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="94" cy="33" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="72" cy="46" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="86" cy="48" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      {/* Lateral line */}
      <path d="M46 35 Q84 34 120 40" />
    </svg>
  );
}

function Abbor() {
  return (
    <svg {...SVG_PROPS}>
      {/* Perch body */}
      <path d="M24 40 Q44 22 92 27 Q112 30 128 40 Q112 50 92 53 Q44 58 24 40Z" />
      {/* Tail */}
      <path d="M128 36 L146 28 M128 44 L146 52" />
      {/* Spiny front dorsal fin */}
      <path d="M52 25 L56 10 L62 22 L68 10 L74 22 L78 12 L82 24" />
      {/* Soft rear dorsal fin */}
      <path d="M84 26 Q96 14 108 28" />
      {/* Anal fin */}
      <path d="M88 53 Q98 66 108 53" />
      {/* Pectoral fin */}
      <path d="M50 40 Q46 54 58 52 Q66 50 64 40" />
      {/* Spiny operculum */}
      <path d="M38 28 L32 22" />
      {/* Eye */}
      <circle cx="30" cy="36" r="4" />
      <circle cx="30" cy="36" r="2" fill="currentColor" stroke="none" />
      {/* Vertical stripes */}
      <path d="M62 28 Q60 40 62 52" strokeWidth="2" />
      <path d="M74 26 Q72 40 74 54" strokeWidth="2" />
      <path d="M86 26 Q84 40 86 54" strokeWidth="2" />
      <path d="M98 28 Q96 40 98 54" strokeWidth="2" />
      <path d="M110 30 Q108 40 110 52" strokeWidth="2" />
    </svg>
  );
}

function Gjedde() {
  return (
    <svg {...SVG_PROPS}>
      {/* Very elongated body 3:1+ */}
      <path d="M14 40 Q25 31 120 35 Q136 36 142 40 Q136 44 120 45 Q25 49 14 40Z" />
      {/* Duck-bill snout taking 1/4 of length */}
      <path d="M14 38 Q6 40 14 42" />
      {/* Large mouth lower jaw */}
      <path d="M14 40 Q25 44 36 40" />
      {/* Upper jaw */}
      <path d="M14 38 Q24 34 36 38" />
      {/* Teeth hint */}
      <path d="M18 42 L20 46 M24 43 L26 47 M30 42 L32 46" />
      {/* Dorsal fin positioned far back near tail */}
      <path d="M110 32 Q124 20 134 34" />
      {/* Anal fin also far back */}
      <path d="M112 46 Q124 58 132 46" />
      {/* Pectoral */}
      <path d="M38 38 Q42 50 48 42" />
      {/* Eye */}
      <circle cx="22" cy="37" r="3" />
      {/* Lateral line */}
      <path d="M40 38 Q85 37 138 40" />
    </svg>
  );
}

function Harr() {
  return (
    <svg {...SVG_PROPS}>
      {/* Medium trout-like body */}
      <path d="M25 40 Q44 26 90 31 Q112 34 128 40 Q112 46 90 49 Q44 54 25 40Z" />
      {/* Square tail */}
      <path d="M128 36 L146 30 L146 50 L128 44" />
      {/* VERY large sail-like dorsal fin - signature feature */}
      <path d="M52 29 Q56 6 64 4 Q72 2 80 8 Q88 14 94 20 Q100 26 104 30" />
      {/* Dorsal fin base line */}
      <path d="M52 29 L104 30" />
      {/* Adipose fin */}
      <path d="M108 34 Q114 27 118 34" fill="currentColor" />
      {/* Anal fin */}
      <path d="M84 50 Q92 62 102 50" />
      {/* Pectoral */}
      <path d="M50 38 Q55 52 62 44" />
      {/* Small mouth */}
      <path d="M25 40 Q22 42 24 44" />
      {/* Eye */}
      <circle cx="31" cy="37" r="3" />
      {/* Lateral line */}
      <path d="M46 37 Q88 36 124 40" />
    </svg>
  );
}

function GenericFish() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M26 40 Q50 22 105 32 Q122 35 132 40 Q122 45 105 48 Q50 58 26 40Z" />
      <path d="M132 40 L150 28 M132 40 L150 52" />
      <path d="M65 28 Q80 12 95 28" />
      <path d="M82 50 Q92 62 102 50" />
      <path d="M52 38 Q57 50 63 42" />
      <circle cx="32" cy="38" r="3.5" />
      <path d="M50 36 Q92 36 128 40" />
    </svg>
  );
}

const FISH_MAP: Record<string, () => React.ReactElement> = {
  Torsk: Torsk,
  Kveite: Kveite,
  Sei: Sei,
  Hyse: Hyse,
  Lange: Lange,
  Brosme: Brosme,
  Uer: Uer,
  Steinbit: Steinbit,
  Makrell: Makrell,
  Rødspette: Rodspette,
  Lomre: Lomre,
  Sandflyndre: Sandflyndre,
  Sild: Sild,
  Laks: Laks,
  Sjøørret: Sjoorret,
  Sjørøye: Sjotroye,
  Ørret: Orret,
  Røye: Roye,
  Abbor: Abbor,
  Gjedde: Gjedde,
  Harr: Harr,
};

export function FishSvg({ name, className }: { name: string; className?: string }) {
  const Component = FISH_MAP[name] ?? GenericFish;
  return (
    <span className={className}>
      <Component />
    </span>
  );
}
