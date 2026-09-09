import { Link } from "react-router";
import {
  ArrowRight,
  Contact,
  Download,
  FileText,
  Receipt,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInvoices } from "@/contexts/invoices-context";
import { formatDate, formatMoney, invoiceSubtotal } from "@/lib/invoice-utils";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Contact,
    title: "Pick a contact",
    description: "Choose from your saved businesses — bill-to fields fill in automatically.",
  },
  {
    icon: Receipt,
    title: "Add line items",
    description: "Describe services or products, set quantities and prices, preview live.",
  },
  {
    icon: Download,
    title: "Export PDF",
    description: "Print or save as PDF from your browser. No account, no cloud lock-in.",
  },
] as const;

const highlights = [
  {
    icon: Sparkles,
    title: "Free invoice manager",
    description: "Create, view, and export invoices without subscriptions or sign-in.",
  },
  {
    icon: Shield,
    title: "Local-first",
    description: "Contacts and invoices stay in your browser until you choose to export them.",
  },
  {
    icon: FileText,
    title: "Clean viewer",
    description: "Professional invoice layout with from / bill-to blocks and running totals.",
  },
] as const;

export function LandingPage() {
  const { invoices } = useInvoices();
  const recent = invoices.slice(0, 5);

  return (
    <div className="space-y-20 pb-12 md:space-y-28">
      <section className="relative overflow-hidden rounded-2xl border bg-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative px-6 py-14 md:px-12 md:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="secondary" className="mb-5">
              Open & free invoice manager
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Create invoices.
              <span className="block text-muted-foreground">Export in one click.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Krill Bill helps you draft professional invoices, auto-fill client details from
              contacts, and save PDFs locally — no login required.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/invoices/new">
                  <FileText className="size-4" />
                  New invoice
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contacts">
                  <Contact className="size-4" />
                  Manage contacts
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/invoices">
                  View all invoices
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recent invoices</h2>
              <p className="mt-1 text-muted-foreground">Pick up where you left off.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/invoices">See all</Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {recent.map((invoice) => (
              <Link key={invoice.id} to={`/invoices/${invoice.id}`}>
                <Card className="transition-colors hover:bg-muted/20">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold">{invoice.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.to.business_name || invoice.to.name} · {formatDate(invoice.issue_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(invoiceSubtotal(invoice), invoice.currency)}
                      </p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {invoice.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            Three steps from contact to PDF — built for freelancers and small teams.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="relative gap-4 py-5 shadow-sm">
              <CardHeader className="gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Built for</h2>
          <p className="mt-3 text-muted-foreground">
            Simple invoicing when you want control of your data and a polished PDF output.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <Card
              key={item.title}
              className={cn("gap-4 py-5 shadow-sm transition-colors hover:bg-muted/20")}
            >
              <CardHeader className="gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
                  <item.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 px-6 py-12 text-center md:px-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ready when you are</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Start with a blank invoice or add contacts first — everything stays on this device.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/invoices/new">Create an invoice</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/settings">Set your company profile</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
