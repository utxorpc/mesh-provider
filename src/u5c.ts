import { CardanoQueryClient, CardanoSubmitClient } from "@utxorpc/sdk";
import { AccountInfo, Action, Asset, AssetMetadata, BlockInfo, IEvaluator, IFetcher, IListener, ISubmitter, Protocol, TransactionInfo, UTxO } from "@meshsdk/common";
import type * as spec from "@utxorpc/spec";
import { toAddress } from "@meshsdk/core-csl";
import { Address, HexBlob } from '@blaze-cardano/core';

export class U5CProvider implements IFetcher, ISubmitter, IEvaluator, IListener {
    private queryClient: CardanoQueryClient;
    private submitClient: CardanoSubmitClient;

    constructor({
      url,
      headers,
    }: {
      url: string;
      headers?: Record<string, string>;
    }) {
      this.queryClient = new CardanoQueryClient({
        uri: url,
        headers,
      });

      this.submitClient = new CardanoSubmitClient({
        uri: url,
        headers,
      });
    }
    onTxConfirmed(txHash: string, callback: () => void, limit?: number): void {
        throw new Error("Method not implemented.");
    }
    evaluateTx(tx: string): Promise<Omit<Action, "data">[]> {
        throw new Error("Method not implemented.");
    }
    submitTx(tx: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    fetchAccountInfo(address: string): Promise<AccountInfo> {
        throw new Error("Method not implemented.");
    }

    async fetchAddressUTxOs(address: string, asset?: string): Promise<UTxO[]> {
        const addressBytes = new Uint8Array(
            Buffer.from(toAddress(address).to_bytes()),
        );
        const utxoSearchResult = await this.queryClient.searchUtxosByAddress(addressBytes)

        return utxoSearchResult.map((item) => {
            const utxo = this._rpcUtxoToMeshUtxo(item.txoRef, item.parsedValued!);
            
            if (asset) {
                // Check if the output amount contains the specified asset
                if (utxo.output.amount.some((amountItem) => amountItem.unit === asset)) {
                    return utxo; // Return the utxo if asset matches
                }
                // If the asset does not match, return undefined
                return undefined; 
            }
            
            // If no asset is specified, return the utxo directly
            return utxo;
        }).filter((utxo) => utxo !== undefined); // Filter out undefined results        
    }

    fetchAssetAddresses(asset: string): Promise<{ address: string; quantity: string; }[]> {
        throw new Error("Method not implemented.");
    }
    fetchAssetMetadata(asset: string): Promise<AssetMetadata> {
        throw new Error("Method not implemented.");
    }
    fetchBlockInfo(hash: string): Promise<BlockInfo> {
        throw new Error("Method not implemented.");
    }
    fetchCollectionAssets(policyId: string, cursor?: number | string): Promise<{ assets: Asset[]; next?: string | number | null; }> {
        throw new Error("Method not implemented.");
    }
    fetchHandle(handle: string): Promise<object> {
        throw new Error("Method not implemented.");
    }
    fetchHandleAddress(handle: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    fetchProtocolParameters(epoch: number): Promise<Protocol> {
        throw new Error("Method not implemented.");
    }
    fetchTxInfo(hash: string): Promise<TransactionInfo> {
        throw new Error("Method not implemented.");
    }
    fetchUTxOs(hash: string): Promise<UTxO[]> {
        throw new Error("Method not implemented.");
    }
    get(url: string): Promise<any> {
        throw new Error("Method not implemented.");
    }


    private _rpcUtxoToMeshUtxo(rpcTxoRef: spec.query.TxoRef, rpcTxOutput: spec.cardano.TxOutput): UTxO {
        const amount: Asset[] = [
            {
                unit: 'lovelace',
                quantity: rpcTxOutput.coin.toString()
            }
        ]
        rpcTxOutput.assets.forEach((ma) => {
            ma.assets.forEach((asset) => {
                amount.push({
                    unit: Buffer.from(ma.policyId).toString("hex") + Buffer.from(asset.name).toString("hex"),
                    quantity: asset.outputCoin.toString()
                })
            });
        });
    
        let dataHash: string | undefined = undefined
        let plutusData: string | undefined = undefined
    
        if (rpcTxOutput.datum !== undefined) {
            if (
              rpcTxOutput.datum?.originalCbor &&
              rpcTxOutput.datum.originalCbor.length > 0
            ) {
                dataHash = Buffer.from(rpcTxOutput.datum.hash).toString("hex")
                plutusData = Buffer.from(rpcTxOutput.datum.originalCbor).toString("hex")
            } else if (rpcTxOutput.datum?.hash && rpcTxOutput.datum.hash.length > 0) {
                dataHash = Buffer.from(rpcTxOutput.datum.hash).toString("hex")
            }
          }
    
        let scriptRef: string | undefined = undefined
        let scriptHash: string | undefined = undefined
    
        if (rpcTxOutput.script !== undefined) {
            // TODO: Implement scriptRef
            // TODO: Implement scriptHash
        }
    
    
        return {
                input: {
                    outputIndex: rpcTxoRef.index,
                    txHash: Buffer.from(rpcTxoRef.hash).toString("hex")
                },
                output: {
                    address: Address.fromBytes(HexBlob.fromBytes(rpcTxOutput.address)).toBech32(),
                    amount: amount,
                    dataHash: dataHash,
                    plutusData: plutusData,
                    scriptRef: scriptRef,
                    scriptHash: scriptHash
                }
            }
    }
}