import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex-1 bg-[#0A0A0A] text-white">
      {/* ヒーロー */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-4">
          STRUT
        </h1>
        <p className="text-[#E8315B] text-lg md:text-xl font-medium mb-4">
          着た服が、収益になる。
        </p>
        <p className="text-gray-400 max-w-md mb-10 leading-relaxed">
          今日のコーデを登録するだけで、近くにいる人があなたのスタイルを発見・購入できる。
          GPS連動型ファッション広告プラットフォーム。
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="bg-[#E8315B] hover:bg-[#c9264e] text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            無料で始める
          </Link>
          <Link
            href="/auth/login"
            className="border border-white/30 hover:border-white text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            ログイン
          </Link>
        </div>
      </section>

      {/* 特徴 */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '👟',
              title: 'WALKER',
              desc: '毎日のコーデを登録。閲覧・購入されるたびにポイントを獲得。',
            },
            {
              icon: '🗺️',
              title: 'SEARCHER',
              desc: 'GPS で近くのおしゃれな人のコーデをリアルタイム発見。そのまま購入。',
            },
            {
              icon: '🏷️',
              title: 'BRAND',
              desc: '人気 WALKER に着用依頼を送り、リアルなインフルエンサーマーケティング。',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 rounded-2xl p-6 border border-white/10"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
