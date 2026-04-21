import Image from "next/image";
import Navbar from "@/components/Navbar";
import Herosection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <Herosection />
    </main>
  );
}
