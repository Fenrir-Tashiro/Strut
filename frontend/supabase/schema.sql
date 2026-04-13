-- =============================
-- STRUT — データベーススキーマ
-- Supabase SQL Editor で実行してください
-- =============================

-- プロフィール
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username     text UNIQUE NOT NULL,
  display_name text,
  avatar_url   text,
  roles        text[] DEFAULT '{searcher}',
  bio          text,
  points       integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- イベント（outfits より先に作成）
CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  venue_name  text,
  lat         float,
  lng         float,
  radius_m    integer DEFAULT 200,
  start_at    timestamptz,
  end_at      timestamptz,
  qr_code     text,
  is_active   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- コーデ投稿
CREATE TABLE IF NOT EXISTS outfits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walker_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title         text,
  description   text,
  date          date DEFAULT CURRENT_DATE,
  lat           float,
  lng           float,
  location_name text,
  is_active     boolean DEFAULT true,
  view_count    integer DEFAULT 0,
  buy_count     integer DEFAULT 0,
  is_event      boolean DEFAULT false,
  event_id      uuid REFERENCES events(id),
  created_at    timestamptz DEFAULT now()
);

-- アウトフィットアイテム
CREATE TABLE IF NOT EXISTS outfit_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id  uuid REFERENCES outfits(id) ON DELETE CASCADE,
  category   text,
  brand_name text,
  item_name  text,
  price      integer,
  buy_url    text,
  image_url  text,
  sort_order integer DEFAULT 0
);

-- インタラクションログ
CREATE TABLE IF NOT EXISTS interactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id      uuid REFERENCES outfits(id) ON DELETE CASCADE,
  item_id        uuid REFERENCES outfit_items(id) ON DELETE SET NULL,
  searcher_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type           text CHECK (type IN ('view', 'click', 'purchase')),
  points_awarded integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- ブランド着用依頼
CREATE TABLE IF NOT EXISTS brand_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  walker_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  fee         integer,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  deadline    date,
  created_at  timestamptz DEFAULT now()
);

-- =============================
-- Row Level Security
-- =============================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events         ENABLE ROW LEVEL SECURITY;

-- profiles ポリシー
CREATE POLICY "プロフィールは誰でも閲覧可" ON profiles FOR SELECT USING (true);
CREATE POLICY "自分のプロフィールのみ作成可" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "自分のプロフィールのみ更新可" ON profiles FOR UPDATE USING (auth.uid() = id);

-- outfits ポリシー
CREATE POLICY "アクティブなコーデは誰でも閲覧可" ON outfits FOR SELECT USING (true);
CREATE POLICY "WALKERのみコーデ作成可" ON outfits FOR INSERT WITH CHECK (auth.uid() = walker_id);
CREATE POLICY "自分のコーデのみ更新可" ON outfits FOR UPDATE USING (auth.uid() = walker_id);
CREATE POLICY "自分のコーデのみ削除可" ON outfits FOR DELETE USING (auth.uid() = walker_id);

-- outfit_items ポリシー
CREATE POLICY "アイテムは誰でも閲覧可" ON outfit_items FOR SELECT USING (true);
CREATE POLICY "コーデオーナーのみアイテム作成可" ON outfit_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND walker_id = auth.uid())
  );
CREATE POLICY "コーデオーナーのみアイテム更新可" ON outfit_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND walker_id = auth.uid())
  );
CREATE POLICY "コーデオーナーのみアイテム削除可" ON outfit_items FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND walker_id = auth.uid())
  );

-- interactions ポリシー
CREATE POLICY "インタラクションは認証ユーザーが作成可" ON interactions FOR INSERT
  WITH CHECK (auth.uid() = searcher_id);
CREATE POLICY "自分のインタラクションのみ閲覧可" ON interactions FOR SELECT
  USING (auth.uid() = searcher_id);
CREATE POLICY "WALKERは自分のコーデのインタラクション閲覧可" ON interactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND walker_id = auth.uid())
  );

-- brand_requests ポリシー
CREATE POLICY "依頼は当事者のみ閲覧可" ON brand_requests FOR SELECT
  USING (auth.uid() = brand_id OR auth.uid() = walker_id);
CREATE POLICY "BRANDのみ依頼作成可" ON brand_requests FOR INSERT
  WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "WALKERのみステータス更新可" ON brand_requests FOR UPDATE
  USING (auth.uid() = walker_id);

-- events ポリシー
CREATE POLICY "イベントは誰でも閲覧可" ON events FOR SELECT USING (true);

-- =============================
-- ポイント付与 Postgres Function
-- =============================

CREATE OR REPLACE FUNCTION award_points(
  p_walker_id uuid,
  p_points    integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    points       = points + p_points,
    total_earned = total_earned + p_points
  WHERE id = p_walker_id;
END;
$$;
