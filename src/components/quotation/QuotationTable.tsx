import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Download, Search, Filter, Upload, FileText  } from 'lucide-react';
import { servicesData } from '@/data/servicesData';

interface QuotationTableProps {
  quotations: any[];
  onEdit: (quotation: any) => void;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string) =>Promise<void>;
  onUpload: (quotation: any) => void;              
  onDownloadUploaded: (id: string) => Promise<void>;         
}

const QuotationTable = ({ quotations, onEdit, onDelete, onDownload,  onUpload,
  onDownloadUploaded}: QuotationTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService = serviceFilter === 'all' || quotation.serviceKey === serviceFilter;

    const matchesDate = !dateFilter || new Date(quotation.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();

    return matchesSearch && matchesService && matchesDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or quotation number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {Object.keys(servicesData).map((key) => (
                <SelectItem key={key} value={key}>
                  {servicesData[key].title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-[150px]"
          placeholder="Filter by date"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No quotations found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow key={quotation._id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{quotation.quotationNumber}</Badge>
                  </TableCell>
                  <TableCell>{quotation.title}</TableCell>
                  <TableCell>{servicesData[quotation.serviceKey]?.title || quotation.serviceKey}</TableCell>
                  <TableCell>₹{quotation.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell>{new Date(quotation.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {quotation.lastEditedBy ? (
                      <div className="text-sm">
                        <div>{quotation.lastEditedBy}</div>
                        <div className="text-muted-foreground">
                          {quotation.history?.length > 0
                            ? new Date(quotation.history[quotation.history.length - 1].editedAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                 <TableCell>
  <div className="flex gap-2">

    <Button
      variant="outline"
      size="sm"
      onClick={() => onEdit(quotation)}
    >
      <Edit className="w-4 h-4" />
    </Button>

    <Button
      variant="outline"
      size="sm"
      onClick={() => onDownload(quotation._id)}
    >
      <Download className="w-4 h-4" />
    </Button>

    <Button
      variant="outline"
      size="sm"
      onClick={() => onDelete(quotation._id)}
    >
      <Trash2 className="w-4 h-4" />
    </Button>

    {/* ✅ NEW: Upload button */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => onUpload(quotation)}
    >
      <Upload className="w-4 h-4" />
    </Button>

    {/* ✅ NEW: Download uploaded file */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDownloadUploaded(quotation._id)}
    >
      <FileText className="w-4 h-4" />
    </Button>

  </div>
</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QuotationTable;
