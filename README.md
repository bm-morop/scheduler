# スケジューラー

スマホのホーム画面に追加できるスケジュール管理アプリです。

## GitHubへのアップ手順

### 1. リポジトリを作成
GitHubで新しいリポジトリを作成します。
- リポジトリ名: `scheduler`（他の名前にする場合は vite.config.js の `base` も変更）
- Public / Private どちらでもOK

### 2. このフォルダをアップロード
ターミナルで以下を実行:

```bash
cd scheduler
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/scheduler.git
git push -u origin main
```

### 3. GitHub Pages を有効化
1. リポジトリの **Settings** → **Pages** を開く
2. Source を **GitHub Actions** に変更して保存
3. しばらく待つと自動でビルド＆デプロイされます

### 4. アクセスURL
```
https://あなたのユーザー名.github.io/scheduler/
```

### 5. ホーム画面に追加
**iPhone:** Safariで上記URLを開く → 共有ボタン →「ホーム画面に追加」  
**Android:** Chromeで上記URLを開く → メニュー →「ホーム画面に追加」
