"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export function ProfileForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const storedUsername = localStorage.getItem("user");
        if (!storedUsername) {
          setIsChecking(false);
          return;
        }

        // サーバー上でユーザーの存在を確認
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("ユーザーリストの取得に失敗しました");
        }

        const users = await response.json();
        if (!Array.isArray(users) || !users.includes(storedUsername)) {
          // サーバー上にユーザーが存在しない場合は、localStorageをクリア
          localStorage.removeItem("user");
          setError("セッションが無効になりました。再度ログインしてください。");
          setIsChecking(false);
          return;
        }

        // ユーザーが存在する場合は、/serectページにリダイレクト
        router.push("/serect");
      } catch (error) {
        console.error("User check error:", error);
        setError("ユーザー情報の確認に失敗しました。再度ログインしてください。");
        localStorage.removeItem("user");
        setIsChecking(false);
      }
    };

    checkExistingUser();
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null);
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: values.username }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "ユーザー登録に失敗しました");
      }

      console.log("User registration successful:", data);
      localStorage.setItem("user", values.username);
      router.push("/serect");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "ユーザー登録に失敗しました");
    }
  }

  if (isChecking) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto text-center">
          ユーザー情報を確認中...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md mx-auto">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ユーザー名</FormLabel>
                <FormControl>
                  <Input placeholder="ユーザー名を入力" {...field} />
                </FormControl>
                <FormDescription>
                  ゲームで使用するユーザー名を入力してください。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button type="submit">登録</Button>
        </form>
      </Form>
    </div>
  );
}
