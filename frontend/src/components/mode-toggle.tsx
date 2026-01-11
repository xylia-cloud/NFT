import { Moon, Sun, SunMoon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} className="h-9 w-9 relative">
      <Sun 
        className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 rotate-90 absolute'}`} 
      />
      <Moon 
        className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90 absolute'}`} 
      />
      <SunMoon 
        className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'system' ? 'scale-100 rotate-0' : 'scale-0 rotate-90 absolute'}`} 
      />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
