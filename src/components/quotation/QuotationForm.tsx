import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { servicesData } from '@/data/servicesData';

interface QuotationFormProps {
  quotation?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type DocumentsType = string[] | {
  membersDetails: string[];
  societyDetails: string[];
  witnessDetails: string[];
};

type DocumentSections = 'membersDetails' | 'societyDetails' | 'witnessDetails';

const QuotationForm = ({ quotation, onSubmit, onCancel }: QuotationFormProps) => {
  const [formData, setFormData] = useState<{
    serviceKey: string;
    title: string;
    documents: DocumentsType;
    steps: string[];
    time: string;
    baseAmount: string;
    gstPercent: number;
    notes: string;
    clientName: string;
    societyName: string;
    executiveName: string;
    website: string;
    youtube: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    ownerName: string;
    paymentTerms: string;
    memberLimit: number;
  }>({
    serviceKey: '',
    title: '',
    documents: {
      membersDetails: [],
      societyDetails: [],
      witnessDetails: [],
    },
    steps: [],
    time: '',
    baseAmount: '',
    gstPercent: 18,
    notes: '',
    clientName: '',
    societyName: '',
    executiveName: '',
    website: '',
    youtube: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    ownerName: '',
    paymentTerms: '',
    memberLimit: 7,
  });

  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    if (quotation) {
      const documents = quotation.documents;
      let normalizedDocuments: DocumentsType;
      if (Array.isArray(documents)) {
        normalizedDocuments = documents;
      } else if (documents && typeof documents === 'object') {
        normalizedDocuments = {
          membersDetails: documents.membersDetails || [],
          societyDetails: documents.societyDetails || [],
          witnessDetails: documents.witnessDetails || [],
        };
      } else {
        normalizedDocuments = {
          membersDetails: [],
          societyDetails: [],
          witnessDetails: [],
        };
      }

      setFormData({
        serviceKey: quotation.serviceKey || '',
        title: quotation.title || '',
        documents: normalizedDocuments,
        steps: quotation.steps || [],
        time: quotation.time || '',
        baseAmount: quotation.baseAmount?.toString() || '',
        gstPercent: quotation.gstPercent || 18,
        notes: quotation.notes || '',
        clientName: quotation.clientName || '',
        societyName: quotation.societyName || '',
        executiveName: quotation.executiveName || '',
        website: quotation.website || '',
        youtube: quotation.youtube || '',
        contactPhone: quotation.contactPhone || '',
        contactEmail: quotation.contactEmail || '',
        address: quotation.address || '',
        ownerName: quotation.ownerName || '',
        paymentTerms: quotation.paymentTerms || '',
        memberLimit: quotation.memberLimit || 7,
      });
      if (quotation.serviceKey && servicesData[quotation.serviceKey]) {
        setSelectedService(servicesData[quotation.serviceKey]);
      }
    }
  }, [quotation]);

  const handleServiceChange = (serviceKey: string) => {
    const service = servicesData[serviceKey];
    if (service) {
      setFormData({
        ...formData,
        serviceKey,
        title: service.title,
        documents: service.documents,
        steps: service.steps,
        time: service.time,
      });
      setSelectedService(service);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      baseAmount: parseFloat(formData.baseAmount),
      gstPercent: parseFloat(formData.gstPercent.toString()),
    };
    onSubmit(submitData);
  };

  const addDocument = () => {
    if (Array.isArray(formData.documents)) {
      setFormData({
        ...formData,
        documents: [...formData.documents, ''],
      });
    }
  };

  const updateDocument = (index: number, value: string) => {
    if (Array.isArray(formData.documents)) {
      const newDocuments = [...formData.documents];
      newDocuments[index] = value;
      setFormData({
        ...formData,
        documents: newDocuments,
      });
    }
  };

  const removeDocument = (index: number) => {
    if (Array.isArray(formData.documents)) {
      setFormData({
        ...formData,
        documents: formData.documents.filter((_, i) => i !== index),
      });
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, ''],
    });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({
      ...formData,
      steps: newSteps,
    });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const addDocumentToSection = (section: DocumentSections) => {
    if (!Array.isArray(formData.documents) && formData.documents[section]) {
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          [section]: [...formData.documents[section], ''],
        },
      });
    }
  };

  const updateDocumentInSection = (section: DocumentSections, index: number, value: string) => {
    if (!Array.isArray(formData.documents) && formData.documents[section]) {
      const newSection = [...formData.documents[section]];
      newSection[index] = value;
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          [section]: newSection,
        },
      });
    }
  };

  const removeDocumentFromSection = (section: DocumentSections, index: number) => {
    if (!Array.isArray(formData.documents) && formData.documents[section]) {
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          [section]: formData.documents[section].filter((_, i) => i !== index),
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Selection */}
        <div className="space-y-2">
          <Label htmlFor="serviceKey">Service *</Label>
          <Select value={formData.serviceKey} onValueChange={handleServiceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(servicesData).map(([key, service]: [string, any]) => (
                <SelectItem key={key} value={key}>
                  {service.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        {/* Base Amount */}
        <div className="space-y-2">
          <Label htmlFor="baseAmount">Base Amount (₹) *</Label>
          <Input
            id="baseAmount"
            type="number"
            step="0.01"
            value={formData.baseAmount}
            onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
            required
          />
        </div>

        {/* GST Percent */}
        <div className="space-y-2">
          <Label htmlFor="gstPercent">GST Percent *</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="gstPercent"
              type="number"
              step="0.01"
              value={formData.gstPercent}
              onChange={(e) => setFormData({ ...formData, gstPercent: parseFloat(e.target.value) })}
              disabled={formData.gstPercent === 0}
              required={formData.gstPercent !== 0}
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.gstPercent === 0}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.checked ? 0 : 18 })}
              />
              <span>No GST</span>
            </label>
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="time">Timeframe</Label>
          <Input
            id="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Client Name */}
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        {/* Society Name */}
        <div className="space-y-2">
          <Label htmlFor="societyName">Society Name</Label>
          <Input
            id="societyName"
            value={formData.societyName}
            onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
          />
        </div>

        {/* Executive Name */}
        <div className="space-y-2">
          <Label htmlFor="executiveName">Executive Name</Label>
          <Input
            id="executiveName"
            value={formData.executiveName}
            onChange={(e) => setFormData({ ...formData, executiveName: e.target.value })}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        {/* YouTube */}
        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube</Label>
          <Input
            id="youtube"
            value={formData.youtube}
            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          />
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
          />
        </div>

        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
          />
        </div>

        {/* Payment Terms */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Textarea
            id="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            rows={2}
          />
        </div>

        {/* Member Limit */}
        <div className="space-y-2">
          <Label htmlFor="memberLimit">Member Limit</Label>
          <Input
            id="memberLimit"
            type="number"
            min="1"
            value={formData.memberLimit}
            onChange={(e) => setFormData({ ...formData, memberLimit: parseInt(e.target.value)  })}
          />
        </div>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Required Documents
            {Array.isArray(formData.documents) && (
              <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                Add Document
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(formData.documents) ? (
            formData.documents.map((doc, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={doc}
                  onChange={(e) => updateDocument(index, e.target.value)}
                  placeholder="Enter document requirement"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDocument(index)}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <>
              {/* Members Details */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  Member's Details (Max {formData.memberLimit} Members)
                  <Button type="button" variant="outline" size="sm" onClick={() => addDocumentToSection('membersDetails')}>
                    Add
                  </Button>
                </h4>
                {formData.documents.membersDetails.map((doc, index) => (
                  <div key={index} className="flex gap-2 mb-1">
                    <Input
                      value={doc}
                      onChange={(e) => updateDocumentInSection('membersDetails', index, e.target.value)}
                      placeholder="Enter member detail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocumentFromSection('membersDetails', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {/* Society Details */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  Society Details
                  <Button type="button" variant="outline" size="sm" onClick={() => addDocumentToSection('societyDetails')}>
                    Add
                  </Button>
                </h4>
                {formData.documents.societyDetails.map((doc, index) => (
                  <div key={index} className="flex gap-2 mb-1">
                    <Input
                      value={doc}
                      onChange={(e) => updateDocumentInSection('societyDetails', index, e.target.value)}
                      placeholder="Enter society detail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocumentFromSection('societyDetails', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {/* Witness Details */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  Witness Details (Max 2)
                  <Button type="button" variant="outline" size="sm" onClick={() => addDocumentToSection('witnessDetails')}>
                    Add
                  </Button>
                </h4>
                {formData.documents.witnessDetails.map((doc, index) => (
                  <div key={index} className="flex gap-2 mb-1">
                    <Input
                      value={doc}
                      onChange={(e) => updateDocumentInSection('witnessDetails', index, e.target.value)}
                      placeholder="Enter witness detail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocumentFromSection('witnessDetails', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Process Steps
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              Add Step
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                placeholder="Enter process step"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeStep(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Amount Preview */}
      {formData.baseAmount && (
        <Card>
          <CardHeader>
            <CardTitle>Amount Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span>₹{parseFloat(formData.baseAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({formData.gstPercent}%):</span>
                <span>₹{(parseFloat(formData.baseAmount) * formData.gstPercent / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{(parseFloat(formData.baseAmount) * (1 + formData.gstPercent / 100)).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {quotation ? 'Update Quotation' : 'Create Quotation'}
        </Button>
      </div>
    </form>
  );
};

export default QuotationForm;
