# Portfolio-backend

説明説明説明説明説明説明説明説明

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

```
{
  "slack": {
    "contentful_webhook_url": CONTENTFUL_WEBHOOK_URL,
    "server_webhook_url": SERVER_WEBHOOK_URL
  },
  "contentful": {
    "space_id": SPACE_ID,
    "access_token": ACCESS_TOKEN
  }
}
```

## :raised_hand: Author

RyoTa.
