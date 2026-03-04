import WishList from "@/app/components/WishList";

export default function Home() {
  return (
    <main className="h-screen bg-[#0a1628] overflow-hidden flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 overflow-hidden px-6 py-6">
        <WishList />
      </div>
    </main>
  );
}
