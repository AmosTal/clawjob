import SwipeDeck from "@/components/SwipeDeck";
import { sampleJobs } from "@/lib/data";

export default function Home() {
  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6">
        {/* Logo */}
        <h1 className="mb-4 text-center text-xl font-black tracking-tight text-white">
          claw<span className="text-emerald-400">job</span>
        </h1>

        <SwipeDeck jobs={sampleJobs} />
      </div>
    </div>
  );
}
