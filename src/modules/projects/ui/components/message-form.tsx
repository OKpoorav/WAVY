import { useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import { useState } from "react"
import TextareaAutoSize from "react-textarea-autosize"
import z from "zod"
import { toast } from "sonner"
import { ArrowUpIcon,Loader2Icon } from "lucide-react"
import {useMutation , useQueryClient} from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"
import {Form,FormField } from "@/components/ui/form"
import { Button } from "@/components/ui/button"

interface Props{
    projectId:string
}
const formSchema = z.object({
    value:z.string()
                .min(1,{message:"Message is required error"})
                .max(10000,{message:"Message is too long"}),

})
export const MessageForm = ({projectId}:Props)=>{
    const form = useForm<z.infer<typeof formSchema>>({
        resolver:zodResolver(formSchema),
        defaultValues:{
            value:""
        }
    })
    const queryClient = useQueryClient()
    const trpc = useTRPC()
    const createMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess:()=>{
            form.reset();
        queryClient.invalidateQueries(
            trpc.messages.getMany.queryOptions({projectId})
        )
        },
        onError:(err)=>{
            toast.error(err.message)
        }
    }))
    const [isFocused,setIsFocused] = useState(false)
    const showUsage = false
    const isPending = createMessage.isPending
    const isDisabeled = isPending||!form.formState.isValid
    const onSubmit= async (values:z.infer<typeof formSchema>)=>{
        await createMessage.mutateAsync({
            value:values.value,
            projectId
        })
    }
    return (
    <div>
        <Form {...form}>
            <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className={cn(
                "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                isFocused&&"shadow-xs",
                showUsage&&"rounded-t-none"
            )}
            
            action="">

                <FormField
                control = {form.control}
                name="value"
                render ={({field})=>(
                    <TextareaAutoSize
                    {...field}
                    disabled={isPending}
                    onFocus={()=> setIsFocused(true)}
                    onBlur={()=>setIsFocused(false)}
                    minRows={2}
                    maxRows={8}
                    className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                    placeholder="What will you like to build?"
                    onKeyDown={(e)=>{
                        if(e.key==="Enter" &&(e.ctrlKey||e.metaKey)){
                            e.preventDefault()
                            form.handleSubmit(onSubmit)(e)
                        }
                    }}
                    />
                )}
                
                />
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span >
                                &#8984;
                            </span>Enter
                        </kbd>
                        &nbsp; to submit
                    </div>
                    <Button
                    disabled={isDisabeled}
                    className={cn(
                        "size-8 rounded-full",
                        isDisabeled && "bg-muted-foreground border"
                    )}> 
                    {isPending?(
                        <Loader2Icon className="size-4 animate-spin"/>
                    ):(<ArrowUpIcon/>)}
                    </Button>
                </div>
            </form>

        </Form>
    </div>
)


}