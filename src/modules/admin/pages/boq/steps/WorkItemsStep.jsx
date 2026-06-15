import { useState } from "react";
import { ArrowRight, ArrowLeft, Wrench, ChevronDown, CheckSquare, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const WORK_CATEGORIES = [
  {
    id: "floor", name: "Floor Work Items", items: [
      { id: "f1", name: "Ceramic Tiling", rate: 12.50, unit: "Sq Ft" },
      { id: "f2", name: "Wooden Flooring", rate: 25.00, unit: "Sq Ft" },
      { id: "f3", name: "Skirting", rate: 5.00, unit: "Running Ft" },
    ]
  },
  {
    id: "wall", name: "Wall Work Items", items: [
      { id: "w1", name: "Plastering", rate: 8.00, unit: "Sq Ft" },
      { id: "w2", name: "Two Coats Painting", rate: 6.50, unit: "Sq Ft" },
      { id: "w3", name: "Wall Paper Installation", rate: 15.00, unit: "Sq Ft" },
    ]
  },
  {
    id: "ceiling", name: "Ceiling Work Items", items: [
      { id: "c1", name: "Gypsum False Ceiling", rate: 18.00, unit: "Sq Ft" },
      { id: "c2", name: "Ceiling Painting", rate: 7.00, unit: "Sq Ft" },
    ]
  }
];

export default function WorkItemsStep({ nextStep, prevStep, flowData, updateData }) {
  const [selectedItems, setSelectedItems] = useState(flowData.workItems || []);

  const toggleItem = (item, catId) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, categoryId: catId }]);
    }
  };

  const handleNext = () => {
    updateData({ workItems: selectedItems });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">6. Assign Work Items</h2>
          <p className="text-muted-foreground">Select work items for each surface from the Work Master.</p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {selectedItems.length} Items Selected
        </Badge>
      </div>

      <Accordion type="multiple" defaultValue={["floor", "wall", "ceiling"]} className="space-y-4">
        {WORK_CATEGORIES.map(category => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-white shadow-sm px-2">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center text-base font-semibold">
                <Wrench className="w-5 h-5 mr-3 text-slate-500" />
                {category.name}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 pt-2">
                {category.items.map(item => {
                  const isSelected = !!selectedItems.find(i => i.id === item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-slate-50"
                      }`}
                      onClick={() => toggleItem(item, category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${item.rate.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">per {item.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleNext}>Review & Save <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
