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

  const { keyring } = require('@polkadot/ui-keyring');
  const fs = require('fs');

  function RaaSAdminNode(n) {
    RED.nodes.createNode(this, n);
    this.raas = n.raas;
    this.raasConfig = RED.nodes.getNode(this.raas);

    if (this.raasConfig) {
      var node = this;
      var credentials = RED.nodes.getCredentials(node.raas);

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

        var operation = msg.operation || n.operation;
        var contractName = msg.contractname || n.contractname;
        var abiFile = msg.abifile || n.abifile;

        node.raasConfig.apiConnect(function(api, error) {
          if (error) {
            return node.sendMsg(error);
          }
          node.raasConfig.api = api;

          switch (operation) {
            case 'save':
              try {
                var readFile = fs.readFileSync(abiFile, 'utf-8');

                keyring.saveContract(credentials.contractAddr, {
                  contract: {
                    abi: readFile || undefined,
                    genesisHash: node.raasConfig.api.genesisHash.toHex()
                  },
                  contractName,
                  tags: []
                });

                node.sendMsg('', 'Your contract has been successfully instantiated.');

              } catch(e) {
                console.log(e);
                node.sendMsg(e);
              }
              break;
            case 'forget':
              try {
                keyring.forgetContract(credentials.contractAddr);
                node.sendMsg('', 'Removed the contract instance.');

              } catch(e) {
                console.log(e);
                node.sendMsg(e);
              }
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

  RED.nodes.registerType('raas-admin', RaaSAdminNode);
}
