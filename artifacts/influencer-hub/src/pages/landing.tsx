import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Megaphone, Users, Zap, TrendingUp, CheckCircle, ArrowRight, ShieldCheck, ArrowRightLeft } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            I
          </div>
          <span className="text-2xl font-bold tracking-tight">Influencer<span className="text-primary">Hub</span></span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-semibold" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="font-semibold rounded-full px-6" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6 lg:px-12 flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10"></div>
          
          <Badge variant="outline" className="mb-8 px-4 py-1 border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            The new standard for influencer marketing
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6">
            Where serious brands meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">exceptional creators</span>.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Stop digging through DMs and spreadsheets. InfluencerHub gives you the tools to discover, vet, hire, and pay top-tier creators in one precise platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base shadow-lg shadow-primary/25" asChild>
              <Link href="/login">
                I'm a Brand
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur" asChild>
              <Link href="/login">I'm a Creator</Link>
            </Button>
          </div>
          
          <div className="mt-20 w-full max-w-5xl">
            <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden ring-1 ring-border/50">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="rounded-xl border shadow-sm w-full h-[500px] object-cover object-top opacity-90"
              />
            </div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="py-12 border-y bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">Trusted by fast-growing brands</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-60 grayscale">
              {['Acme Corp', 'GlobalTech', 'Nexus', 'Stark Ind.', 'Wayne Ent.'].map((logo, i) => (
                <div key={i} className="text-2xl font-bold tracking-tighter">{logo}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need to scale your campaigns.</h2>
            <p className="text-xl text-muted-foreground">We built the infrastructure so you can focus on building relationships and creating incredible content.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-6 w-6 text-primary" />,
                title: "AI-Powered Discovery",
                description: "Find the exact audience match. Our AI analyzes demographics, engagement rates, and content style to recommend the perfect creators."
              },
              {
                icon: <Zap className="h-6 w-6 text-cyan-500" />,
                title: "Frictionless Workflows",
                description: "From initial pitch to final payment, every step is templated, trackable, and transparent. Say goodbye to messy email threads."
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-teal-500" />,
                title: "Real-time ROI Tracking",
                description: "Live dashboards that show impressions, clicks, conversions, and estimated ROI. Know exactly what your spend is yielding."
              }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dual Value Prop */}
        <section className="py-32 bg-slate-900 text-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div>
                <Badge variant="outline" className="mb-6 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">For Brands</Badge>
                <h2 className="text-4xl font-bold mb-6 leading-tight">Stop guessing. Start measuring.</h2>
                <ul className="space-y-4 mb-8">
                  {["Verified audience analytics", "Automated contract generation", "Escrow payments", "Campaign performance dashboards"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" className="rounded-full bg-white text-slate-900 hover:bg-slate-200">
                  Post a Campaign
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-primary/20 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-3xl border border-white/10 bg-slate-800 p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="w-16 h-16 rounded-full ring-2 ring-cyan-500" />
                    <div>
                      <h4 className="font-bold text-lg">Sarah Jenkins</h4>
                      <p className="text-slate-400 text-sm">Tech & Lifestyle Creator</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold text-cyan-400">8.4%</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Engagement</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-3/4 bg-slate-700 rounded-full"></div>
                    <div className="h-3 w-1/2 bg-slate-700 rounded-full"></div>
                    <div className="h-3 w-5/6 bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-3xl p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
            <h2 className="text-4xl font-bold mb-6 relative z-10">Ready to elevate your partnerships?</h2>
            <p className="text-xl text-muted-foreground mb-10 relative z-10">Join thousands of brands and creators building better business together.</p>
            <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/25 relative z-10" asChild>
              <Link href="/login">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6 lg:px-12 bg-muted/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              I
            </div>
            <span className="text-xl font-bold tracking-tight">Influencer<span className="text-primary">Hub</span></span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 InfluencerHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  )
}
