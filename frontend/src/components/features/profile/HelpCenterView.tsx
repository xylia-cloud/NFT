import { useState } from "react";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const faqSections = [
    {
      title: t("help.plasmaOne.title"),
      items: [
        {
          question: t("help.plasmaOne.q1"),
          answer: t("help.plasmaOne.a1"),
        },
        {
          question: t("help.plasmaOne.q2"),
          answer: t("help.plasmaOne.a2"),
        },
        {
          question: t("help.plasmaOne.q3"),
          answer: t("help.plasmaOne.a3"),
        },
        {
          question: t("help.plasmaOne.q4"),
          answer: t("help.plasmaOne.a4"),
        },
        {
          question: t("help.plasmaOne.q5"),
          answer: t("help.plasmaOne.a5"),
        },
        {
          question: t("help.plasmaOne.q6"),
          answer: t("help.plasmaOne.a6"),
        },
        {
          question: t("help.plasmaOne.q7"),
          answer: t("help.plasmaOne.a7"),
        },
        {
          question: t("help.plasmaOne.q8"),
          answer: t("help.plasmaOne.a8"),
        },
        {
          question: t("help.plasmaOne.q9"),
          answer: t("help.plasmaOne.a9"),
        },
        {
          question: t("help.plasmaOne.q10"),
          answer: t("help.plasmaOne.a10"),
        },
      ],
    },
    {
      title: t("help.xpl.title"),
      items: [
        {
          question: t("help.xpl.q1"),
          answer: t("help.xpl.a1"),
        },
        {
          question: t("help.xpl.q2"),
          answer: t("help.xpl.a2"),
        },
        {
          question: t("help.xpl.q3"),
          answer: t("help.xpl.a3"),
        },
      ],
    },
    {
      title: t("help.wallet.title"),
      items: [
        {
          question: t("help.wallet.q1"),
          answer: t("help.wallet.a1"),
        },
        {
          question: t("help.wallet.q2"),
          answer: t("help.wallet.a2"),
        },
        {
          question: t("help.wallet.q3"),
          answer: t("help.wallet.a3"),
        },
      ],
    },
    {
      title: t("help.deposit.title"),
      items: [
        {
          question: t("help.deposit.q1"),
          answer: t("help.deposit.a1"),
        },
        {
          question: t("help.deposit.q2"),
          answer: t("help.deposit.a2"),
        },
        {
          question: t("help.deposit.q3"),
          answer: t("help.deposit.a3"),
        },
      ],
    },
    {
      title: t("help.staking.title"),
      items: [
        {
          question: t("help.staking.q1"),
          answer: t("help.staking.a1"),
        },
        {
          question: t("help.staking.q2"),
          answer: t("help.staking.a2"),
        },
        {
          question: t("help.staking.q3"),
          answer: t("help.staking.a3"),
        },
        {
          question: t("help.staking.q4"),
          answer: t("help.staking.a4"),
        },
      ],
    },
    {
      title: t("help.referral.title"),
      items: [
        {
          question: t("help.referral.q1"),
          answer: t("help.referral.a1"),
        },
        {
          question: t("help.referral.q2"),
          answer: t("help.referral.a2"),
        },
        {
          question: t("help.referral.q3"),
          answer: t("help.referral.a3"),
        },
      ],
    },
    {
      title: t("help.security.title"),
      items: [
        {
          question: t("help.security.q1"),
          answer: t("help.security.a1"),
        },
      ],
    },
    {
      title: t("help.other.title"),
      items: [
        {
          question: t("help.other.q1"),
          answer: t("help.other.a1"),
        },
        {
          question: t("help.other.q2"),
          answer: t("help.other.a2"),
        },
        {
          question: t("help.other.q3"),
          answer: t("help.other.a3"),
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {t("help.subtitle")}
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
              <p className="text-sm font-medium text-foreground">{t("help.contactTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("help.contactDesc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
