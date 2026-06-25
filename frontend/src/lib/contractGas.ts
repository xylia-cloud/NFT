import type { Abi, Address, ContractFunctionArgs, ContractFunctionName, PublicClient } from 'viem';

const GAS_BUFFER_NUMERATOR = 120n;
const GAS_BUFFER_DENOMINATOR = 100n;
/** 合约调用 gas 下限，避免钱包使用 21000 默认值 */
const FALLBACK_GAS_LIMIT = 500_000n;

/**
 * 预估合约 gas 并加 20% 缓冲，防止 Plasma 链 "Gas Limit 太低" 报错
 */
export async function estimateContractGasLimit<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
>(
  publicClient: PublicClient,
  params: {
    address: Address;
    abi: TAbi;
    functionName: TFunctionName;
    args: ContractFunctionArgs<TAbi, never, TFunctionName>;
    account: Address;
  }
): Promise<bigint> {
  try {
    const estimated = await publicClient.estimateContractGas({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
      account: params.account,
    });
    const withBuffer =
      (estimated * GAS_BUFFER_NUMERATOR) / GAS_BUFFER_DENOMINATOR;
    return withBuffer > estimated ? withBuffer : estimated + 50_000n;
  } catch (error) {
    console.warn('Gas 预估失败，使用 fallback:', error);
    return FALLBACK_GAS_LIMIT;
  }
}
