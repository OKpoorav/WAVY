import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import TextareaAutoSize from "react-textarea-autosize"
import z from "zod"
import { toast } from "sonner"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"
import { Form, FormField } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { PROJECT_TEMPLATES } from "@/app/(home)/constant"

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required error" })
    .max(10000, { message: "Message is too long" }),
})

export const ProjectForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  })
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions())
        router.push(`/projects/${data.id}`)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  )
  const [isFocused, setIsFocused] = useState(false)
  const isPending = createProject.isPending
  const isDisabeled = isPending || !form.formState.isValid
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
    })
  }
  const onSelect=(content:string)=>{
    form.setValue("value",content,
        {
            shouldDirty:true,
            shouldValidate:true,
            shouldTouch:true
        }
    )
  }
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
    <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "w-full border border-orange-500/40 p-4 rounded-xl bg-neutral-800/80 backdrop-blur-sm shadow-lg transition-all text-white",
            isFocused && "shadow-[0_0_10px_rgba(249,115,22,0.5)] border-orange-500"
          )}
          action=""
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutoSize
                {...field}
                disabled={isPending}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                minRows={2}
                maxRows={8}
                className="pt-4 resize-none border-none w-full outline-none bg-transparent text-white placeholder:text-zinc-400"
                placeholder="What will you like to build?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    form.handleSubmit(onSubmit)(e)
                  }
                }}
              />
            )}
          />
          <div className="flex gap-x-2 items-end justify-between pt-2">
            <div className="text-[10px] text-zinc-400 font-mono">
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-300">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp; to submit
            </div>
            <Button
              disabled={isDisabeled}
              className={cn(
                "size-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white",
                isDisabeled &&
                  "bg-zinc-700 border border-zinc-600 hover:bg-zinc-700"
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
            </Button>
          </div>
        </form>
        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">

            {PROJECT_TEMPLATES.map((template)=>(
                <Button key={template.title}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/30 border-white/20 backdrop-blur-md  " 
                onClick={()=>onSelect(template.prompt)}
                >

                {template.emoji}
                {template.title}
                </Button>
            ))}
        </div>
    </section>

      </Form>
    </div>
  )
}