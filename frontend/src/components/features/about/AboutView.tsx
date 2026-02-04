import { Card, CardContent } from "@/components/ui/card";

export function AboutView() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Stablecoin-native features, full EVM compatibility, and the tooling developers expect.
        </p>
      </div>

      <Card className="border-border/40 shadow-sm bg-card/50">
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">TL;DR</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Purpose-built for stablecoins</strong>: Native support for zero fee USD₮ transfers, custom gas
                tokens, and confidential payments
              </li>
              <li>
                <strong>High-performance architecture</strong>: Pipelined Fast HotStuff consensus with a modular EVM
                execution layer built on Reth
              </li>
              <li>
                <strong>Bitcoin-native</strong>: Trust-minimized bridge for real BTC with direct cross-asset programmability
              </li>
              <li>
                <strong>EVM compatible</strong>: Use existing Solidity tooling with no changes required
              </li>
              <li>
                <strong>Integrated infrastructure</strong>: Card issuance, on and offramps, and compliance tooling available
                through trusted partners
              </li>
              <li>
                <strong>Deep liquidity</strong>: Launching with ~$2B in USD₮ available from day one
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Why Build on Plasma</h2>
            <p>
              Plasma is a Layer 1 blockchain purpose-built for global stablecoin payments. It combines high throughput,
              stablecoin-native features, and full EVM compatibility, giving developers the foundational infrastructure to
              build next-generation payment and financial applications.
            </p>
            <p>
              Developers can deploy applications and protocols using the tools they already use, including Hardhat, Foundry,
              and wallets like MetaMask. Plasma also provides protocol-maintained contracts for zero fee USD₮ transfers,
              custom gas tokens, and confidential payments. These features are scoped for stablecoin use cases and integrate
              cleanly with EIP-4337 and EIP-7702 smart accounts. While not yet embedded at the protocol level, they are
              designed for deeper coordination with block building and execution over time.
            </p>
            <p>
              Whether a developer is building anything from a wallet to an FX system or a consumer application, Plasma gives
              them the speed, liquidity, and flexibility to operate at global scale.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Design Philosophy</h2>
            <p>
              Plasma is built around a simple principle: stablecoins deserve first-class treatment at the protocol level.
            </p>
            <p>
              Instead of relying on middleware or external wrappers, Plasma provides native tools for cost abstraction,
              privacy, and programmable gas. These tools are usable out of the box and are designed to integrate more deeply
              over time with the chain’s execution logic.
            </p>
            <p>
              The result is a developer experience that is simpler and more robust with fewer dependencies, faster iteration,
              and stronger guarantees. All while remaining fully compatible with the EVM ecosystem.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Architecture Overview</h2>
            <p>
              Plasma is built around three core architectural components:
            </p>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1. PlasmaBFT Consensus Layer</h3>
              <p>
                PlasmaBFT is a pipelined implementation of the Fast HotStuff consensus algorithm. Unlike traditional designs
                that process each stage sequentially, Plasma parallelizes the proposal, vote, and commit process into
                concurrent pipelines. This increases throughput and reduces time to finality.
              </p>
              <p>
                Finality is deterministic and typically achieved within seconds. The protocol maintains safety and liveness
                under partial synchrony and provides full Byzantine fault tolerance.
              </p>
              <p>
                This consensus design is optimized for stablecoin workloads, with high transaction volume, low latency, and
                consistent performance under global demand.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2. EVM Execution Layer</h3>
              <p>
                Plasma’s execution environment is fully EVM compatible and built on Reth, a high-performance, modular
                Ethereum execution client written in Rust. Developers can deploy contracts using standard Solidity with no
                modifications from Ethereum mainnet.
              </p>
              <p>
                All major tooling is supported out of the box, including wallets, SDKs, libraries, and developer frameworks.
                There is no need for bridging layers, custom compilers, or modified contract patterns.
              </p>
              <p>
                Plasma combines predictable execution with full compatibility, making it straightforward to build and scale
                EVM-native applications.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">3. Native Bitcoin Bridge</h3>
              <p>
                Plasma includes a trust-minimized Bitcoin bridge that allows BTC to be moved directly into the EVM
                environment. The bridge is non-custodial and secured by a network of verifiers that will decentralize over
                time to validate Bitcoin transactions on Plasma without centralized intermediaries.
              </p>
              <p>
                Bridged BTC can be used in smart contracts, collateral systems, and cross-asset flows. Users retain control
                of their funds while gaining access to programmable Bitcoin onchain.
              </p>
              <p>
                This enables BTC-backed stablecoins, trustless collateral, and Bitcoin-denominated finance within a single
                environment.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Stablecoin-Native Contracts</h2>
            <p>
              Plasma maintains a set of protocol-governed contracts tailored for stablecoin applications. These contracts are
              tightly scoped, security-audited, and designed to work directly with smart account wallets. They are managed by
              the Plasma Foundation and evolve alongside the protocol.
            </p>
            <p>
              Over time, they are intended to integrate deeper into the execution environment, with support for prioritized
              transaction inclusion, native runtime enforcement, and protocol-level incentives.
            </p>
            <p>
              These contracts are usable out of the box and composable with account abstraction standards such as EIP-4337
              and EIP-7702.
            </p>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1. Zero Fee USD₮ Transfers</h3>
              <p>
                Plasma includes a dedicated paymaster contract that sponsors gas for USD₮ transfers. The contract is
                restricted to transfer and transferFrom calls on the USD₮ token. It does not support arbitrary calldata,
                ensuring predictable behavior and reducing attack vectors.
              </p>
              <p>
                Eligibility for sponsorship is determined using lightweight identity verification (such as zkEmail) and
                enforced rate limits. Once approved, gas is sponsored from a pre-funded XPL allowance managed by the Plasma
                Foundation.
              </p>
              <p>
                This allows developers to offer seamless, fee-free transfers to end users while maintaining strict cost
                control and blocking spam.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2. Custom Gas Tokens</h3>
              <p>
                Plasma offers a protocol-maintained ERC-20 paymaster that allows approved tokens to be used for gas payments
                instead of XPL. Projects can register stablecoins or ecosystem tokens to support gas abstraction in their
                applications.
              </p>
              <p>
                Unlike general-purpose paymasters that introduce complexity or charge fees, Plasma’s paymaster is scoped,
                audited, and fee-free. The logic is maintained by the protocol, making it safe for use in production.
              </p>
              <p>
                This model lets developers eliminate the friction of native token onboarding and deliver stablecoin-first
                user experiences.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">3. Confidential Payments</h3>
              <p>
                Plasma is developing a privacy-preserving transfer module for stablecoins like USD₮. The goal is to let users
                shield amounts, recipient addresses, and memo data, while preserving full composability and support for
                regulatory disclosures.
              </p>
              <p>
                The system is opt-in and designed for practical financial use cases, such as payroll, treasury flows, and
                private settlements. It will be implemented in standard Solidity, with no custom opcodes or alternative
                virtual machines.
              </p>
              <p>
                The module is under active research and will be maintained by the protocol once finalized. It is built to
                integrate cleanly with existing wallets and dapps without requiring changes to user flows.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Official website</span>
            <a
              href="https://www.plasma.to"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              https://www.plasma.to
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

