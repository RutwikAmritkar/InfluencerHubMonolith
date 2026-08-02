import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["brand", "influencer"]),
});

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "brand",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setUser(data.user);
          queryClient.setQueryData(getGetMeQueryKey(), data);
          toast.success("Logged in successfully");
          setLocation("/dashboard");
        },
        onError: () => {
          toast.error("Invalid email or password");
        },
      }
    );
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setUser(data.user);
          queryClient.setQueryData(getGetMeQueryKey(), data);
          toast.success("Account created successfully");
          setLocation("/dashboard");
        },
        onError: () => {
          toast.error("Failed to create account. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  I
                </div>
                <span className="text-xl font-bold tracking-tight">Influencer<span className="text-primary">Hub</span></span>
              </div>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {isRegistering ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {isRegistering
                ? "Join the network of top creators and brands."
                : "Enter your credentials to access your account."}
            </p>
          </div>

          {!isRegistering ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <Button variant="link" className="p-0 h-auto text-xs font-normal" type="button">
                          Forgot password?
                        </Button>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I want to use InfluencerHub as a:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 flex-1 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                            <FormControl>
                              <RadioGroupItem value="brand" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full text-center">Brand</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 flex-1 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                            <FormControl>
                              <RadioGroupItem value="influencer" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full text-center">Creator</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name or Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              {isRegistering ? "Already have an account?" : "Don't have an account?"}
            </span>{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Sign in" : "Sign up"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
