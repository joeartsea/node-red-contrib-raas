node-red-contrib-raas
========================

このノードは、<a href="https://substrate.dev/substrate-contracts-workshop/#/0/introduction" target="_new">Substrate Smart Contracts</a> を操作する<a href="http://nodered.org" target="_new">Node-RED</a> ノードのコレクションです。

[![NPM](https://nodei.co/npm/node-red-contrib-raas.png?downloads=true)](https://nodei.co/npm/node-red-contrib-raas/)

前提条件
-------

node-red-contrib-raasは、<a href="http://nodered.org" target="_new">Node-RED</a>のインストールが必要です。

また、Substrateローカル開発チェーンにスマートコントラクトをアップロードします。

1. <a href="https://substrate.dev/substrate-contracts-workshop/#/0/setup" target="_new">Substrateスマートコントラクトの実行環境</a>を構築します。
1. 次のコマンドを実行してローカル開発チェーンを開始します。<pre>canvas --dev --tmp</pre>
1. ターミナルでノードの実行が確認できたら、<a href="https://paritytech.github.io/canvas-ui" target="_new">Canvas UI</a>を使ってノードにコンパイルしたコントラクトコードをアップロードします。<br>
コードのアップロード手順は、Substrate DeveloperHub ink! Smart Contracts Tutorial の[Deploying Your Contract](https://substrate.dev/substrate-contracts-workshop/#/0/deploy-contract) を参考にします。


インストール
-------

Node-REDをインストールしたルートディレクトリで以下のコマンドを実行します。

    npm install node-red-contrib-raas

Node-REDインスタンスを再起動すると、パレットにraasノードが表示されて使用可能になります。

概要
-------

node-red-contrib-raasは、次のモジュールを含んでいます。

### raas-admin ノード

raas-adminノードは、Substrateローカル開発チェーンにアップロードしたコントラクトのインスタンスをNode-REDで操作できる状態に保存・削除します。


### raas ノード

raasノードは、コントラクトの以下の操作を行います。

- **ポイント発行** - ポイントを発行します。

- **権限付与** - 選択した店舗にポイント付与権限を与えます。

- **ポイント付与** - 選択した店舗がユーザにポイントを付与します。

- **ポイント利用** - 選択した店舗でユーザがポイントを利用します。

- **オーナーポイント確認** - 発行済ポイント数を取得します。

- **店舗ポイント確認** - 選択した店舗が付与したポイント数を取得します。

- **店舗/ユーザポイント確認** - 選択した店舗がユーザに付与したポイント数を取得します。

- **ユーザポイント確認** - 選択したユーザが保有するポイント数を取得します。

謝辞
-------

node-red-contrib-raasは、次のオープンソースソフトウェアを使用しています。

- [@polkadot/api](https://github.com/polkadot-js/api/tree/master/packages/api): ノードにクエリを実行し、Javascriptを使用してPolkadotまたはSubstrateチェーンと対話する機能を提供します
- [@polkadot/api-contract](https://github.com/polkadot-js/api/tree/master/packages/api-contract): Substrateのコントラクトを管理できるようにします
- [@polkadot/keyring](https://github.com/polkadot-js/common/tree/master/packages/keyring): さまざまな入力の組み合わせからのキーリングペアの生成と取得を含む、ユーザーアカウントのキー管理する機能を提供します
- [@polkadot/ui-keyring](https://github.com/polkadot-js/api): ブラウザで使用するためにベースの@polkadot / keyringインターフェースを拡張するラッパー


ライセンス
-------

こちらを参照してください。 [license](https://github.com/joeartsea/node-red-contrib-raas/blob/master/LICENSE) (Apache License Version 2.0).

貢献
-------

[GitHub issues](https://github.com/joeartsea/node-red-contrib-raas/issues)への問題提起、Pull requestsのどちらもあなたの貢献を歓迎します。


開発者
-------

開発者がnode-red-contrib-raasのソースを改変する場合、以下のコードを実行してクローンを作成します。

```
cd ~\.node-red\node_modules
git clone https://github.com/joeartsea/node-red-contrib-raas.git
cd node-red-contrib-raas
npm install
```
