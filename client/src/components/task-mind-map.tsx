import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Maximize2, Minimize2, Brain } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface MindMapNode {
  id: string;
  title: string;
  category: string;
  priority: string;
  tags: string[];
  x: number;
  y: number;
  connections: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function TaskMindMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch all tasks
  const { data: tasksData } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks = (tasksData as any)?.tasks || [];

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (query: string) => 
      apiRequest('/api/ai/mind-map-chat', 'POST', { 
        tasks: tasks,
        query: query 
      }),
    onSuccess: (response) => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: response.advice,
        timestamp: new Date()
      }]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI advice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate task connections based on similar tags and categories
  const calculateConnections = (tasks: Task[]): MindMapNode[] => {
    const nodes: MindMapNode[] = [];
    const radius = 200;
    const centerX = 400;
    const centerY = 300;

    tasks.forEach((task, index) => {
      const angle = (index / tasks.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Find connections based on similar tags or category
      const connections: string[] = [];
      tasks.forEach((otherTask) => {
        if (task.id !== otherTask.id) {
          const similarTags = task.tags?.some(tag => 
            otherTask.tags?.includes(tag)
          ) || false;
          const sameCategory = task.category === otherTask.category;
          
          if (similarTags || sameCategory) {
            connections.push(otherTask.id);
          }
        }
      });

      nodes.push({
        id: task.id,
        title: task.title,
        category: task.category || "general",
        priority: task.priority || "medium",
        tags: task.tags || [],
        x,
        y,
        connections
      });
    });

    return nodes;
  };

  // Draw mind map on canvas
  const drawMindMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind nodes)
    nodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const connectedNode = nodes.find(n => n.id === connectionId);
        if (connectedNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 35 : 30, 0, 2 * Math.PI);
      
      // Priority-based colors
      const colors = {
        high: '#ef4444',
        medium: '#f59e0b', 
        low: '#10b981'
      };
      
      ctx.fillStyle = colors[node.priority as keyof typeof colors] || '#6b7280';
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxWidth = 50;
      const words = node.title.split(' ');
      let line = '';
      let y = node.y - 5;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, node.x, y);
          line = words[n] + ' ';
          y += 12;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, node.x, y);
    });
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 30;
    });

    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  // Send chat message
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(chatInput);
    setChatInput("");
  };

  // Update nodes when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const newNodes = calculateConnections(tasks);
      setNodes(newNodes);
    }
  }, [tasks]);

  // Redraw canvas when nodes change
  useEffect(() => {
    drawMindMap();
  }, [nodes, selectedNode]);

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Mind Map Canvas */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Task Mind Map
              <Badge variant="outline" className="ml-2">
                {tasks.length} tasks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="border rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900"
                onClick={handleCanvasClick}
              />
              
              {/* Legend */}
              <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
                <div className="text-sm font-medium mb-2">Priority Legend</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Medium Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Low Priority</span>
                  </div>
                </div>
              </div>

              {/* Selected Node Info */}
              {selectedNodeData && (
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border max-w-xs">
                  <h4 className="font-medium text-sm mb-2">{selectedNodeData.title}</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>Category: {selectedNodeData.category}</div>
                    <div>Priority: {selectedNodeData.priority}</div>
                    {selectedNodeData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedNodeData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs">
                      Connected to {selectedNodeData.connections.length} other tasks
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Panel */}
      <div className={`transition-all duration-300 ${isChatExpanded ? 'w-96' : 'w-80'}`}>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                AI Strategy Chat
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatExpanded(!isChatExpanded)}
              >
                {isChatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ask AI about task optimization and execution strategies
            </p>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 mb-4 h-96">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Ask me about your task connections!</p>
                    <p className="text-xs mt-1">Try: "How should I prioritize these tasks?"</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about task optimization..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={chatMutation.isPending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !chatInput.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}