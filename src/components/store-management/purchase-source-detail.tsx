"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Phone,
  Mail,
  Coins,
  FileText,
  Edit,
  ExternalLink,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Building,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

interface PurchaseSourceDetailProps {
  source: any;
}

export function PurchaseSourceDetail({ source }: PurchaseSourceDetailProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/store-management/purchase-sources"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {source.sourceName}
              </h1>
              <StatusBadge status={source.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {source.sourceCode}
              </span>
              <span>•</span>
              <span className="font-medium text-foreground">{source.sourceType}</span>
              <span>•</span>
              <span>{source.country}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/purchases/new?sourceId=${source.id}`}>
            <Button size="sm" className="gap-2 shadow-sm">
              <ShoppingCart className="w-4 h-4" /> Create Purchase from Source
            </Button>
          </Link>
          <Link href={`/store-management/purchase-sources/${source.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" /> Edit Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Details & Commercials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic & Location */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic & Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Supplier & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Supplier / Company Name</span>
                  <span className="font-medium text-foreground text-sm">
                    {source.supplierName || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">Contact Person</span>
                  <span className="font-medium text-foreground text-sm">
                    {source.contactPerson || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">Phone Number</span>
                  {source.phoneNumber ? (
                    <a
                      href={`tel:${source.phoneNumber}`}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {source.phoneNumber}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">WhatsApp Number</span>
                  {source.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${source.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-green-600 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> {source.whatsappNumber}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">Email Address</span>
                  {source.emailAddress ? (
                    <a
                      href={`mailto:${source.emailAddress}`}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> {source.emailAddress}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">Website</span>
                  {source.website ? (
                    <a
                      href={source.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" /> {source.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Physical Location & Address
                </span>
                {source.googleMapsLocation && (
                  <a
                    href={source.googleMapsLocation}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Country</span>
                  <span className="font-semibold text-foreground text-sm flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" /> {source.country}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">Division / State</span>
                  <span className="font-medium text-foreground">{source.division || "—"}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5">District / City</span>
                  <span className="font-medium text-foreground">
                    {source.district || source.city || "—"}
                  </span>
                </div>

                {source.upazila && (
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Upazila / Thana</span>
                    <span className="font-medium text-foreground">{source.upazila}</span>
                  </div>
                )}

                {source.marketName && (
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Market / Commercial Plaza</span>
                    <span className="font-medium text-foreground">{source.marketName}</span>
                  </div>
                )}

                {source.shopNumber && (
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Shop / Stall Number</span>
                    <span className="font-medium text-foreground">{source.shopNumber}</span>
                  </div>
                )}
              </div>

              {source.fullAddress && (
                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold uppercase">
                    Full Physical Address
                  </span>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {source.fullAddress}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Commercial & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" /> Commercial Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Preferred Currency</span>
                <span className="font-mono font-semibold text-sm text-foreground bg-muted px-2 py-0.5 rounded inline-block">
                  {source.preferredCurrency || "BDT"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block mb-0.5">Payment Terms</span>
                <p className="font-medium text-foreground">
                  {source.paymentTerms || "Standard Net Terms"}
                </p>
              </div>

              {source.supplierNotes && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">Specialties & Notes</span>
                  <p className="text-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                    {source.supplierNotes}
                  </p>
                </div>
              )}

              {source.additionalDescription && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">Additional Description</span>
                  <p className="text-muted-foreground">
                    {source.additionalDescription}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground block mb-0.5 text-[11px]">Registered On</span>
                <span className="text-foreground">{formatDate(source.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Historical Orders</span>
                <span className="text-xl font-bold text-foreground">
                  {source._count?.purchaseOrders ?? 0}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                All purchase orders confirmed and received from this source are recorded in the audit trail.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Linked Purchase Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> Recent Purchase Orders from this Source
            </CardTitle>
            <Link
              href={`/purchases?search=${source.sourceCode}`}
              className="text-xs text-primary font-medium hover:underline"
            >
              View all orders →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {source.purchaseOrders && source.purchaseOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Grand Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {source.purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium text-primary">
                        {po.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(po.orderDate)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {formatCurrency(po.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {formatCurrency(po.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600 font-medium">
                        {formatCurrency(po.dueAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/purchases/${po.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View PO →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No purchase orders recorded yet from this source.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

