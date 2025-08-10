// This is a helper file to rebuild the LinkedIn content with proper navigation
// I'll use this to reconstruct the content properly

const LinkedInContent = () => {
  return (
    <div className="flex gap-8">
      {/* Left Navigation for LinkedIn Sections */}
      <div className="w-80 flex-shrink-0">
        <Card className="sticky top-8">
          <CardContent className="p-6">
            <nav className="space-y-1">
              {[
                { id: "account-header", label: "LinkedIn Settings", icon: Linkedin },
                { id: "account-limit", label: "LinkedIn account limit", icon: Users },
                { id: "activity-schedule", label: "Activity schedule settings", icon: Clock },
                { id: "proxy-location", label: "Proxy location", icon: MapPin },
                { id: "integrations", label: "Integrations Apps", icon: Link },
                { id: "webhooks", label: "Webhooks", icon: Webhook },
                { id: "blacklists", label: "Blacklists", icon: UserX },
                { id: "general-settings", label: "General settings", icon: Settings },
                { id: "disconnect", label: "Disconnect LinkedIn Account", icon: XCircle }
              ].map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setLinkedinActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                      linkedinActiveSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 space-y-6">
        {/* All conditional sections go here */}
      </div>
    </div>
  );
};