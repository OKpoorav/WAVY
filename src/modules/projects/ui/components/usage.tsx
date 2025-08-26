import { CrownIcon } from "lucide-react";
import Link from "next/link";
import { formatDuration, intervalToDuration } from "date-fns";
import { Button } from "@/components/ui/button";

interface Props {
  points: number;
  msBeforeNext: number;
  hasAccess: boolean;
}

export const Usage = ({ points, msBeforeNext, hasAccess }: Props) => {
  return (
    <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
      <div className="flex items-center">
        <div>
          <p className="text-sm">
            {points}{" "}
            {hasAccess ? <>credits remaining</> : <>free credits remaining</>}
          </p>
          <p className="text-xs text-muted-foreground">
            Resets in{" "}
            {formatDuration(
              intervalToDuration({
                start: new Date(),
                end: new Date(Date.now() + msBeforeNext),
              }),
              { format: ["months", "days", "hours"] },
            )}
          </p>
        </div>
        {!hasAccess && (
          <Button
            asChild
            size="sm"
            variant="default"
            className="ml-auto flex items-center gap-1"
          >
            <Link href="/pricing">
              <CrownIcon className="w-4 h-4" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
