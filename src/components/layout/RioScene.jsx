/** Ilustração decorativa da tela de busca: morros, prédios, mar e areia. Fica mais escura no modo escuro. */
export function RioScene() {
  const buildings = [
    [20, 120, 26], [50, 100, 22], [76, 135, 30], [110, 112, 24], [138, 128, 28],
    [270, 118, 26], [300, 100, 24], [328, 132, 30], [362, 110, 26], [392, 126, 24],
  ];
  return (
    <div className="-mx-4 h-[220px] brightness-(--scene-brightness)" aria-hidden="true">
      <svg viewBox="0 0 420 220" preserveAspectRatio="xMidYMid slice" className="block size-full">
        <rect width="420" height="220" fill="#bfe0f5" />
        <path d="M150 170 C180 60 230 30 262 52 C290 70 300 120 330 170 Z" fill="#2f7d4f" />
        <path d="M230 170 C250 110 280 90 310 100 C340 112 350 150 370 170 Z" fill="#3d9a62" />
        <path d="M0 170 C40 120 90 110 140 170 Z" fill="#4aa56d" />
        <line x1="40" y1="70" x2="300" y2="96" stroke="#334155" strokeWidth="1.5" />
        <rect x="150" y="80" width="12" height="7" rx="1" fill="#dc2626" />
        <g fill="#fff">
          <rect x="258" y="26" width="3" height="20" />
          <rect x="250" y="31" width="19" height="3" />
        </g>
        {buildings.map(([x, h, w]) => (
          <rect key={x} x={x} y={170 - h * 0.55} width={w} height={h * 0.55} fill="#e8dcc8" stroke="#cbbca2" />
        ))}
        <rect y="168" width="420" height="22" fill="#2563a6" />
        <path d="M0 176 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#7fb2e0" strokeWidth="2" fill="none" />
        <rect y="190" width="420" height="30" fill="#e9d8a6" />
        <circle cx="120" cy="204" r="9" fill="#1d4ed8" />
        <circle cx="300" cy="200" r="9" fill="#eab308" />
      </svg>
    </div>
  );
}
