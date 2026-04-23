import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, MessageSquare, Book, ExternalLink } from "lucide-react";

const HelpCenterTab = () => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">Help & Support</CardTitle>
          <CardDescription>
            Get help with your account, billing, and technical questions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search Help */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10 h-12" placeholder="Search for articles, guides, and help..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <Book className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-base">Documentation</CardTitle>
            <CardDescription className="text-xs">Browse our comprehensive guides</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <MessageSquare className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-base">Live Chat</CardTitle>
            <CardDescription className="text-xs">Chat with our support team</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <Mail className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-base">Email Support</CardTitle>
            <CardDescription className="text-xs">Send us a detailed request</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "How do I cancel my subscription?",
            "Can I export my resume in different formats?",
            "How does the AI optimization work?",
            "What happens after my trial ends?",
          ].map((q, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
              <span className="text-sm font-medium">{q}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="bg-primary/5 rounded-2xl p-8 text-center space-y-4 border border-primary/10">
        <h3 className="text-lg font-bold">Still need help?</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Our team is available 24/7 to help you with any issues you might be facing.
        </p>
        <Button>Contact Support</Button>
      </div>
    </div>
  );
};

export default HelpCenterTab;
