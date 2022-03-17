# Portfolio-backend

![Portfolio](https://user-images.githubusercontent.com/45546517/125272570-f60a0600-e346-11eb-81ab-c8a96df6c74f.png "Portfolio")

説明説明説明説明説明説明説明説明

## :page_facing_up: システム構成図

後日

## :wrench: 環境構築

### Firebase Local Emulator Suiteでローカルで動かす場合

### Firebaseをdocker環境で動かす場合

#### 1. dockerのビルド

```
./build
# 権限がなかった場合
chmod u+x build
```

#### 2. dockerの起動

```
./start
# 権限がなかった場合
chmod u+x start
```

#### 3. firebaseにログイン

```
firebase login
```

後は、firebase のプロジェクトを作成し、functionsとfirestoreを作成します。

### 環境変数

`functions:config`を利用しており、以下のデータを保持しています

```json
{
  "slack": {
    "contentful_webhook_url": CONTENTFUL_WEBHOOK_URL,
    "server_webhook_url": SERVER_WEBHOOK_URL
  },
  "contentful": {
    "space_id": SPACE_ID,
    "access_token": ACCESS_TOKEN
    "preview_access_token": PREVIEW_ACCESS_TOKEN
  }
}
```

## :raised_hand: Author

<h2 align="center">RyoTa.</h2>
