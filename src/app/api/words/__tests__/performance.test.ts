import { processWordChunk } from '../route';
import { Word, Profession } from '../../../types/types';

describe('API Performance Test', () => {
  it('should measure processWordChunk performance with small dataset', async () => {
    // 测试数据
    const testWords: Word[] = [
      { word: 'test', trans: [], usphone: '', ukphone: '', sentences: new Map<string, string>() },
    ];

    const testProfession: Profession = {
      id: 'developer',
      label: 'Software Developer',
      description: 'Develops software applications'
    };

    // 执行函数并测量性能
    const startTime = performance.now();
    
    try {
      const result = await processWordChunk(testWords, testProfession);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Small dataset (${testWords.length} words) processing time: ${duration.toFixed(2)}ms`);
      
      // 详细验证
      expect(result).toBeDefined();
      expect(result.profession).toEqual(testProfession);
      expect(result.aiResponse).toBeDefined();
      // Check if aiResponse is a valid JSON string
      const parsedResponse = JSON.parse(result.aiResponse);
      expect(Array.isArray(parsedResponse.words)).toBeTruthy();
      expect(parsedResponse.words.length).toBeGreaterThanOrEqual(testWords.length);
    } catch (error) {
      console.error('测试过程中发生错误：', error);
      throw error;
    }
  }, 30000);

  it('should measure processWordChunk performance with medium dataset', async () => {
    // 生成中等大小的测试数据集
    const testWords: Word[] = Array.from({ length: 10 }, (_, i) => ({ 
      word: `testword${i}`,
      trans: [],
      usphone: '',
      ukphone: '',
      sentences: new Map<string, string>()
    }));

    const testProfession: Profession = {
      id: 'developer',
      label: 'Software Developer',
      description: 'Develops software applications'
    };

    // 执行函数并测量性能
    const startTime = performance.now();
    
    try {
      const result = await processWordChunk(testWords, testProfession);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Medium dataset (${testWords.length} words) processing time: ${duration.toFixed(2)}ms`);
      // 基本验证
      expect(result).toBeDefined();
      expect(result.profession).toEqual(testProfession);
      expect(result.aiResponse).toBeDefined();
      // Check if aiResponse is a valid JSON string
      const parsedResponse = JSON.parse(result.aiResponse);
      expect(Array.isArray(parsedResponse.words)).toBeTruthy();
      expect(result.aiResponse).toBeDefined();
    } catch (error) {
      console.error('测试过程中发生错误：', error);
      throw error;
    }
  }, 60000); // 增加超时时间为 60 秒
});