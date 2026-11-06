import { buildGigaChatSystemPrompt } from './gigachat.service';

describe('buildGigaChatSystemPrompt', () => {
  it('requires one clarification at a time and one numbered final answer', () => {
    const prompt = buildGigaChatSystemPrompt();

    expect(prompt).toContain('задай ровно один короткий уточняющий вопрос');
    expect(prompt).toContain('Не задавай больше трёх уточняющих вопросов');
    expect(prompt).toContain('Дай решение одним сообщением');
    expect(prompt).toContain('один нумерованный список');
  });

  it('adds the detected emotional context when it is available', () => {
    expect(buildGigaChatSystemPrompt('sadness')).toContain(
      'эмоциональный фон текущего сообщения: sadness',
    );
  });
});
