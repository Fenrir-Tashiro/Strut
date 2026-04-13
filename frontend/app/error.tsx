'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl mb-4">⚠️</p>
      <h1 className="font-bold text-xl text-[#111111] mb-2">エラーが発生しました</h1>
      <p className="text-gray-500 text-sm mb-8">{error.message ?? '予期しないエラーが発生しました'}</p>
      <button
        onClick={reset}
        className="bg-[#E8315B] text-white px-6 py-3 rounded-full text-sm font-medium"
      >
        再試行する
      </button>
    </div>
  )
}
