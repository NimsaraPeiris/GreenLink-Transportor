import React, { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone, ExternalLink, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface FAQItem {
  question: string;
  answer: string;
}

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const faqs: FAQItem[] = [
    {
      question: 'How do I register my vehicles?',
      answer: 'To register a vehicle, go to the Vehicle Registration page and fill in the required details including plate number, model, and capacity. Make sure to provide accurate information for efficient container assignments.'
    },
    {
      question: 'How are containers assigned to my vehicles?',
      answer: 'Containers are assigned based on your vehicle capacity and availability. When a container needs transport, you will receive a notification and can accept the assignment through the Containers page.'
    },
    {
      question: 'What should I do when I receive a container alert?',
      answer: 'When you receive a container alert, immediately check the container status in the dashboard. Address any temperature or humidity issues, and ensure the container is properly secured. Contact support if you need immediate assistance.'
    },
    {
      question: 'How do I update my vehicle status?',
      answer: 'You can update your vehicle status (active/inactive) through the Vehicles page. This helps manage your fleet availability and ensures efficient container assignments.'
    },
    {
      question: 'How do I monitor multiple container deliveries?',
      answer: 'The dashboard provides a real-time overview of all containers assigned to your vehicles. You can track multiple deliveries, monitor container conditions, and manage routes efficiently from one central location.'
    },
    {
      question: 'What are the temperature requirements for different container types?',
      answer: 'Different containers have specific temperature requirements based on their cargo. These requirements are clearly displayed in the container details, and the system will alert you if temperatures deviate from the acceptable range.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-900">Help Center</h1>
        <p className="mt-1 text-secondary-500">
          Find answers to common questions or contact our support team
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-secondary-900">
                Frequently Asked Questions
              </h2>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-secondary-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-secondary-50"
                    onClick={() => toggleQuestion(index)}
                  >
                    <span className="font-medium text-secondary-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-secondary-500 transition-transform ${
                        expandedQuestions.includes(index) ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedQuestions.includes(index) && (
                    <div className="px-4 py-3 bg-secondary-50 border-t border-secondary-200">
                      <p className="text-secondary-700">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-secondary-900 mb-4">
              Need More Help?
            </h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Phone className="h-4 w-4" />}
              >
                +1 (555) 123-4567
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Mail className="h-4 w-4" />}
              >
                support@greenlink.com
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<MessageCircle className="h-4 w-4" />}
              >
                Live Chat
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-medium text-secondary-900 mb-4">
              Resources
            </h2>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                User Guide
              </a>
              <a
                href="#"
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                API Documentation
              </a>
              <a
                href="#"
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Release Notes
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;