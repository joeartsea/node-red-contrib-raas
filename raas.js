/**
 * Copyright 2018 Atsushi Kojo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
  'use strict';

  const { ApiPromise, WsProvider } = require('@polkadot/api');
  const { keyring } = require('@polkadot/ui-keyring');
  const { Abi, ContractPromise } = require('@polkadot/api-contract');

  function RaaSNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);

    this.apiConnect = async function(callback, msg) {

      if (node.api && node.api.isReady) {
        return callback(node.api);
      }

      var wsUrl = msg.wsUrl || credentials.wsUrl;
      console.log(`ws connected: ${wsUrl}`);
      var provider = new WsProvider(wsUrl);
      var api = new ApiPromise({ provider });

      api.on('ready', async () => {
        try {
          const [chain, nodeName, nodeVersion] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version()
          ]);

          console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

          if (keyring.keyringOption.optionsSubject.value.all.length === 0) {
            keyring.loadAll({
              isDevelopment: true,
              genesisHash: api.genesisHash
            }, []);
          }

          callback(api);

        } catch(e) {
          console.log(e);
          callback(api, e);
        }
      });

      api.on('error', (err) => {
        console.error(err);
        callback(api, `ERROR: disconnected from ${wsUrl}:: connection failed`);
      });
    };
  }

  RED.nodes.registerType('raas', RaaSNode, {
    credentials: {
      wsUrl: { type: 'text' },
      contractAddr: { type: 'text' }
    }
  });


  function RaaSInNode(n) {
    RED.nodes.createNode(this, n);
    this.raas = n.raas;
    this.raasConfig = RED.nodes.getNode(this.raas);

    if (this.raasConfig) {
      var node = this;

      node.createContractPromise = function () {
        var contractPair = keyring.getContract(node.raasConfig.credentials.contractAddr);

        if (!contractPair) {
          return null;
        } else {
          var address = contractPair.address;
          var meta = contractPair.meta;
          var data = meta && meta.contract.abi;

          if (!data) {
            return null;
          } else {
            var abi = new Abi(data);
            var contract = new ContractPromise(node.raasConfig.api, abi, address);
            return contract;
          }
        }
      };
      node.callQuery = async function (messageName, params, isTransaction) {
        var value = 0;
        var gasLimit = -1;

        try {
          await node.contract.query[messageName](node.caller, value, gasLimit, ...params)
          .then(({ gasConsumed, output, result }) => {
            if (result.isOk) {
              if (isTransaction) {
                node.callTransaction(gasConsumed, output, messageName, params);

              } else {
                var result = output.toString() || '';
                node.sendMsg('', result);
              }
            } else {
              var error = result.asErr.value.toString();
              node.sendMsg(error);
            }
          })
          .catch(err => {
            console.error(err);
            node.sendMsg(err);
          });
        } catch(e) {
          console.error(e);
          node.sendMsg(e);
        }
      };
      node.callTransaction = async function (gasConsumed, output, messageName, params) {
        var value = 0;
        var gasLimit = gasConsumed.toBn();
        var outputRecord = output;
        var signPair = keyring.getPair(node.caller);

        if (outputRecord.isError) {
          var resultMessage = `${outputRecord.type}: ${outputRecord.value.toString()}`;
          node.sendMsg('', resultMessage);

        } else {

          await node.contract.tx[messageName](value, gasLimit, ...params)
            .signAndSend(signPair, (result) => {
              if (result.status.isFinalized) {
                if (result.isError) {
                  node.sendMsg('', 'Error');

                } else {
                  node.sendMsg('', 'Success');
                }
              }
            })
            .catch(err => {
              console.error(err);
              node.sendMsg(err);
            });
        }
      };

      node.on('input', function (msg) {
        node.sendMsg = function (err, result) {
          if (err) {
            node.error(err, msg);
            node.status({ fill: 'red', shape: 'ring', text: 'failed' });
          } else {
            msg.payload = result;
            node.status({});
          }
          node.send(msg);
        };

        node.raasConfig.apiConnect(function(api, error) {
          if (error) {
            return node.sendMsg(error);
          }
          node.raasConfig.api = api;

          node.contract = node.createContractPromise();
          if (!node.contract) {
            return node.sendMsg('No contracts available.');
          }

          var operation = msg.operation || n.operation;
          var owner = msg.owner || n.owner;
          var store = msg.store || n.store;
          var user = msg.user || n.user;
          var points = msg.points || n.points || 0;
          node.caller = msg.caller || n.caller;

          switch (operation) {
            case 'issuance':
              node.callQuery('issuancePoints', [points], true);
              break;
            case 'authority':
              node.callQuery('giveAuthority', [store], true);
              break;
            case 'givepoints':
              node.callQuery('giveUserPoints', [store, user, points], true);
              break;
            case 'spendpoints':
              node.callQuery('useUserPoints', [store, user, points], true);
              break;
            case 'ownerpoints':
              node.callQuery('getOwnerPoints', [], false);
              break;
            case 'storepoints':
              node.callQuery('getStorePoints', [store], false);
              break;
            case 'stupoints':
              node.callQuery('getStoreUserPoints', [store, user], false);
              break;
            case 'userpoints':
              node.callQuery('getUserPoints', [user], false);
              break;
            default:
              node.error('unknown operation', msg);
              console.error('unknown operation');
          }
        }, msg);
      });
    } else {
      this.error('missing raas configuration');
    }
  }
  RED.nodes.registerType('raas in', RaaSInNode);


  RED.httpAdmin.get("/raas-node/get-accounts", function (req, res) {
    var raasCredentials = RED.nodes.getCredentials(req.query.credentials);
    var raasNode = RED.nodes.getNode(req.query.id);
    var configNode = RED.nodes.getNode(req.query.credentials);
    var raasConfig = null;

    if (raasNode && raasNode.raasConfig) {
      raasConfig = raasNode.raasConfig;
    } else if (configNode) {
      raasConfig = configNode;
    } else {
      raasConfig = req.query;
      if (raasCredentials) raasConfig.credentials = raasCredentials;
      raasConfig.apiConnect = PolkadptApiConnect;
    }

    if (!req.query.id || !req.query.credentials || !raasConfig) {
      return res.send('{"error": "Missing RaaS credentials"}');
    }

    var credentials = {
      wsUrl: raasConfig.credentials.wsUrl,
      contractAddr: raasConfig.credentials.contractAddr
    };
    RED.nodes.addCredentials(req.query.credentials, credentials);

    raasConfig.apiConnect(function(api, err) {
      if (err) {
        return res.send('{"error": "' + err.toString() + '"}');
      }
      raasConfig.api = api;

      var allAccounts = [];
      allAccounts = keyring.getPairs().map((account) => {
        var accountName =
          (typeof account.meta.name === 'string')? account.meta.name : '';
        return {
          key: account.address,
          value: account.address,
          text: accountName.toUpperCase()
        }
      });
      res.send({ data: allAccounts });
    }, {});
  });

  async function PolkadptApiConnect(callback, msg) {
    var wsUrl = msg.wsUrl || this.wsUrl;
    console.log(`ws connected: ${wsUrl}`);
    var provider = new WsProvider(wsUrl);

    var api = new ApiPromise({ provider });

    api.on('ready', async () => {
      try{
        const [chain, nodeName, nodeVersion] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version()
        ]);

        console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

        if (keyring.keyringOption.optionsSubject.value.all.length === 0) {
          keyring.loadAll({
            isDevelopment: true,
            genesisHash: api.genesisHash
          }, []);
        }

        callback(api);

      } catch(e) {
        console.error(e);
        callback(api, e);
      }
    });

    api.on('error', (err) => {
      console.error(err);
      callback(api, `ERROR: disconnected from ${wsUrl}:: connection failed`);
    });
  }
}
