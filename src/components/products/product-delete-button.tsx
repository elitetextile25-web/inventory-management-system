"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, X, Loader2, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
  productSku: string;
}

export function ProductDeleteButton({
  productId,
  productName,
  productSku,
}: ProductDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [canArchive, setCanArchive] = React.useState(false);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete product");
        if (data.canArchive) {
          setCanArchive(true);
        }
        return;
      }

      toast.success(data.message || `Product "${productName}" deleted successfully!`);
      setIsOpen(false);
      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveInstead = async () => {
    setDeleting(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive product");
      }

      toast.success(`Product "${productName}" archived successfully!`);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive product");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(true);
          setDeleteError(null);
          setCanArchive(false);
        }}
        className="h-9 px-3 gap-1.5 text-danger border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all"
        title="Delete Product"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full shadow-2xl border-danger/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-danger flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-danger" /> Confirm Delete Product
                </CardTitle>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                Are you sure you want to delete product{" "}
                <span className="font-semibold text-foreground">"{productName}"</span> (
                <span className="font-mono text-primary">{productSku}</span>)?
              </p>

              {deleteError && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger space-y-2">
                  <p>{deleteError}</p>
                  {canArchive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleArchiveInstead}
                      disabled={deleting}
                      className="w-full text-xs gap-1 border-danger/30 hover:bg-danger/15 text-danger"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive Product Instead
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

