import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, FileText } from 'lucide-react';

export default function HistoryPage() {
  const historyItems = [
    {
      id: 1,
      action: 'Text Analysis Completed',
      description: 'Analyzed 125 customer reviews',
      time: '2 hours ago',
      sentiment: 'Positive',
    },
    {
      id: 2,
      action: 'CSV Upload Processed',
      description: 'Processed social_media_data.csv with 3,400 entries',
      time: '5 hours ago',
      sentiment: 'Mixed',
    },
    {
      id: 3,
      action: 'Report Generated',
      description: 'Downloaded Q1 2025 Sentiment Report',
      time: '1 day ago',
      sentiment: 'Positive',
    },
    {
      id: 4,
      action: 'Image Analysis Completed',
      description: 'Extracted text from 5 images and analyzed sentiment',
      time: '2 days ago',
      sentiment: 'Neutral',
    },
    {
      id: 5,
      action: 'Text Analysis Completed',
      description: 'Analyzed product feedback survey responses',
      time: '3 days ago',
      sentiment: 'Positive',
    },
    {
      id: 6,
      action: 'CSV Upload Processed',
      description: 'Processed customer_support_tickets.csv',
      time: '4 days ago',
      sentiment: 'Negative',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">Track all your analysis activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your complete analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  {item.action.includes('Report') ? (
                    <FileText className="h-5 w-5 text-white" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{item.action}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.sentiment === 'Positive'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : item.sentiment === 'Negative'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : item.sentiment === 'Mixed'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
                      }`}
                    >
                      {item.sentiment === 'Positive' ? '😊 ' : item.sentiment === 'Negative' ? '😠 ' : item.sentiment === 'Mixed' ? '😐 ' : '😐 '}
                      {item.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {item.time}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
