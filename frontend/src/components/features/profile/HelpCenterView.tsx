import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-3 px-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0">
          <div className="text-xs text-muted-foreground leading-relaxed">
            {typeof answer === "string" ? <p>{answer}</p> : answer}
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpCenterView() {
  const faqSections = [
    {
      title: "钱包连接",
      items: [
        {
          question: "如何连接钱包？",
          answer: "点击右上角「连接钱包」按钮，选择您常用的钱包（OKX、TokenPocket、Bitget、MetaMask 等）进行连接。首次连接需在钱包中确认授权。",
        },
        {
          question: "支持哪些钱包？",
          answer: "PLASMA 支持 OKX、TokenPocket、Bitget、MetaMask 等主流钱包，以及通过 WalletConnect 连接的其他钱包。建议使用 Plasma 网络兼容的钱包。",
        },
        {
          question: "连接失败怎么办？",
          answer: "请确保：1）已安装并解锁钱包；2）网络已切换到 Plasma 主网；3）钱包版本为最新。若仍无法连接，可尝试切换其他钱包或联系客服。",
        },
      ],
    },
    {
      title: "充币与网络",
      items: [
        {
          question: "充币需要走哪个网络？",
          answer: "用户充币必须走 Plasma 网络。请勿使用 BSC、Ethereum 等其他网络充币，否则资产将无法到账。充币前请确认钱包已切换到 Plasma 主网。",
        },
        {
          question: "如何将资产充入 Plasma 网络？",
          answer: "可通过跨链桥（如 Stargate）将 USDT0 从 Ethereum 等链桥接至 Plasma 网络，或直接在支持 Plasma 的交易所/钱包选择 Plasma 网络进行充币。充币地址可在钱包页面查看。",
        },
        {
          question: "充币需要多少 XPL 作为 Gas？",
          answer: "Plasma 网络使用 XPL 作为 Gas 费。建议钱包中预留少量 XPL 以支付充币、质押、提现等链上交易的 Gas 费。具体消耗根据交易复杂度而定。",
        },
      ],
    },
    {
      title: "质押与收益",
      items: [
        {
          question: "如何参与质押？",
          answer: "连接钱包后，在首页选择质押金额（500～30,000 USDT0），点击「立即质押」并确认交易即可。质押成功后，收益将按日自动结算。",
        },
        {
          question: "收益如何计算？",
          answer: "PLASMA 提供约 20% 月化稳定收益。每日收益 = 质押金额 × 20% ÷ 30。收益每日自动发放至您的账户，可随时查看或提取。",
        },
        {
          question: "质押金额有什么限制？",
          answer: "单笔质押金额范围为 500～30,000 USDT0，支持多次追加质押。最低 500 USDT0 起投，可根据需求灵活调整。",
        },
        {
          question: "何时可以提取本金和收益？",
          answer: "质押本金在锁仓期内不可提取，锁仓期满后可自由提取。累计利息可随时提取，无锁仓限制。具体以产品规则为准。",
        },
      ],
    },
    {
      title: "邀请与佣金",
      items: [
        {
          question: "如何邀请好友？",
          answer: "进入「我的」→「邀请好友」，复制您的专属邀请链接或二维码分享给好友。好友通过链接注册并完成质押后，您即可获得佣金。",
        },
        {
          question: "佣金比例是多少？",
          answer: "邀请好友质押后，您可获得高达 15% 的质押佣金。佣金按好友质押金额的一定比例计算，具体以当前活动规则为准。",
        },
        {
          question: "佣金何时到账？",
          answer: "好友完成质押后，佣金将自动结算至您的账户，可在「我的团队」中查看明细。佣金可随时提现。",
        },
      ],
    },
    {
      title: "安全与账户",
      items: [
        {
          question: "PLASMA 安全吗？",
          answer: "PLASMA 智能合约已通过 CertiK 权威安全审计，采用多重签名机制保护资金安全。我们建议您妥善保管钱包助记词，切勿泄露给他人。",
        },
        {
          question: "如何修改提现密码？",
          answer: "进入「我的」→「修改密码」，输入当前密码、新密码并确认后提交。提现密码用于保护资金安全，请勿与登录密码相同。",
        },
        {
          question: "忘记提现密码怎么办？",
          answer: "请联系客服进行身份验证后重置。为保障账户安全，重置流程可能需要一定时间，请提前准备好相关身份证明材料。",
        },
      ],
    },
    {
      title: "其他问题",
      items: [
        {
          question: "如何联系客服？",
          answer: "您可通过「我的」→「联系客服」获取 7×24 小时在线支持。也可通过官方 Telegram、Twitter 等渠道联系我们。",
        },
        {
          question: "支持哪些链？",
          answer: "PLASMA 仅支持 Plasma 网络。充币、质押、收益及提现均需在 Plasma 网络上完成。区块链浏览器可访问 plasmascan.to 查询交易记录。",
        },
        {
          question: "交易需要 Gas 费吗？",
          answer: "是的。连接钱包、充币、质押、提现等链上操作需要支付 XPL 作为 Gas 费。请确保钱包中有足够的 XPL 以完成交易。充币时请选择 Plasma 网络。",
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          常见问题解答，助您快速了解 PLASMA 平台
        </p>
      </div>

      {/* FAQ 分类 */}
      {faqSections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="border-border/40 shadow-sm bg-card/50">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="divide-y divide-border/40">
              {section.items.map((item, itemIndex) => (
                <FAQItem
                  key={itemIndex}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 联系客服提示 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">未找到答案？</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                联系 7×24 小时在线客服，我们将竭诚为您服务
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
