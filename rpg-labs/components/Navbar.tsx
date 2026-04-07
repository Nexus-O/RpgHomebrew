export default function Navbar() {
  return (
    <header className="w-full bg-[#0B0B0D] border-b border-[#1a1a1d]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo-nav.webp" alt="Nexus Carmesin" className="h-8" />
          <span className="text-white font-semibold tracking-widest text-sm">
            NEXUS <span className="text-red-600">CARMESIN</span>
          </span>
        </div>

        {/* Menu */}
        <nav className="flex items-center gap-6 text-sm">
          <a href="#" className="text-white hover:text-red-600 transition">
            INÍCIO
          </a>
          <a href="#" className="text-white hover:text-red-600 transition">
            DOWNLOADS
          </a>
          <a
            href="#"
            className="border border-[#2a2a2d] px-3 py-1 rounded text-gray-300 hover:border-red-600 hover:text-white transition"
          >
            DISCORD
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-1 text-sm rounded transition">
            REGISTRE-SE
          </button>
          <button className="border border-[#2a2a2d] text-white px-4 py-1 text-sm rounded hover:border-red-600 transition">
            LOGIN
          </button>
        </div>
      </div>
    </header>
  );
}