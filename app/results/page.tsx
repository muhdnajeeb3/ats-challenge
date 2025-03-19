// app/results/page.tsx
import ResultCard from '@/components/ResultCard';

export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Interview Assessment
        </h1>
        <ResultCard />
      </div>
    </main>
  );
}