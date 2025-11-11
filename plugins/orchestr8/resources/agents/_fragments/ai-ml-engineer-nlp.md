---
id: ai-ml-engineer-nlp
category: agent
tags: [nlp, transformers, bert, gpt, embeddings, llm, huggingface, tokenization, text-classification, ner]
capabilities:
  - Transformer model implementation
  - Text preprocessing and tokenization
  - Fine-tuning pre-trained models
  - Embeddings and semantic search
  - LLM integration and prompt engineering
useWhen:
  - Building NLP models for text classification, named entity recognition (NER), and sentiment analysis using transformers (BERT, RoBERTa, GPT), HuggingFace, and spaCy
  - Implementing sequence-to-sequence models for machine translation, text summarization, and question answering using encoder-decoder architectures and attention mechanisms
  - Fine-tuning pre-trained language models on domain-specific datasets with transfer learning, LoRA/QLoRA for parameter-efficient training, and prompt engineering
  - Processing text data with tokenization (WordPiece, BPE, SentencePiece), embeddings (Word2Vec, GloVe, FastText), and handling long sequences with sliding windows
  - Building production NLP pipelines with FastAPI endpoints, batch inference optimization, and model serving using TorchServe or TensorFlow Serving
  - Evaluating NLP models using BLEU, ROUGE, perplexity, F1-score for classification, and human evaluation for generation quality
estimatedTokens: 650
---

# AI/ML Engineer - NLP Expertise

## Transformer Models with Hugging Face

**Loading and inference:**
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch

# High-level pipeline (fastest way)
classifier = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
result = classifier("I love this product!")

# Low-level control
model_name = 'bert-base-uncased'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

# Tokenize with proper padding and truncation
inputs = tokenizer(
    ["First text", "Second text"],
    padding=True,
    truncation=True,
    max_length=512,
    return_tensors='pt'
)

# Inference
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    predictions = torch.softmax(logits, dim=-1)
```

## Fine-Tuning Pre-trained Models

**Complete fine-tuning pipeline:**
```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorWithPadding
)
from datasets import load_dataset

# Load dataset
dataset = load_dataset('imdb')
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

# Tokenize dataset
def tokenize_function(examples):
    return tokenizer(
        examples['text'],
        padding='max_length',
        truncation=True,
        max_length=512
    )

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# Model
model = AutoModelForSequenceClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=2
)

# Training configuration
training_args = TrainingArguments(
    output_dir='./results',
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    evaluation_strategy='epoch',
    save_strategy='epoch',
    load_best_model_at_end=True,
    fp16=torch.cuda.is_available(),  # Mixed precision
    logging_steps=100,
    warmup_steps=500
)

# Data collator for dynamic padding
data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets['train'],
    eval_dataset=tokenized_datasets['test'],
    data_collator=data_collator,
    tokenizer=tokenizer
)

trainer.train()
```

## Custom Transformer Architecture

**Building from scratch:**
```python
import torch.nn as nn
from transformers import BertModel

class CustomBertClassifier(nn.Module):
    def __init__(self, model_name: str, num_labels: int, dropout: float = 0.3):
        super().__init__()
        self.bert = BertModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout)

        # Custom classification head
        hidden_size = self.bert.config.hidden_size
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, num_labels)
        )

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        # Get [CLS] token output
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids
        )
        pooled_output = outputs.pooler_output  # [batch_size, hidden_size]

        # Classification
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)

        return logits

# Freeze BERT layers, train only classifier
model = CustomBertClassifier('bert-base-uncased', num_labels=3)
for param in model.bert.parameters():
    param.requires_grad = False

# Later: unfreeze for fine-tuning
for param in model.bert.parameters():
    param.requires_grad = True
```

## Embeddings & Semantic Search

**Sentence embeddings:**
```python
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Generate embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dim, fast
sentences = ["This is a sentence", "Another sentence", "Query sentence"]
embeddings = model.encode(sentences, convert_to_numpy=True)

# FAISS vector search (efficient for large scale)
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)  # L2 distance
index.add(embeddings[:-1])  # Add corpus

# Search
query_embedding = embeddings[-1:][0]
k = 2  # Top 2 results
distances, indices = index.search(np.array([query_embedding]), k)

# Hybrid search: combine dense + sparse (BM25)
from rank_bm25 import BM25Okapi

tokenized_corpus = [doc.lower().split() for doc in corpus]
bm25 = BM25Okapi(tokenized_corpus)
query_tokens = query.lower().split()
bm25_scores = bm25.get_scores(query_tokens)

# Combine scores (normalize and weight)
dense_scores = 1 / (1 + distances[0])  # Convert distance to similarity
combined_scores = 0.7 * dense_scores + 0.3 * bm25_scores[:k]
```

## Named Entity Recognition (NER)

**Custom NER with transformers:**
```python
from transformers import AutoModelForTokenClassification, TokenClassificationPipeline

# Pre-trained NER
ner_pipeline = pipeline('ner', model='dslim/bert-base-NER', aggregation_strategy='simple')
entities = ner_pipeline("Apple Inc. is located in Cupertino, California.")

# Custom NER training
from transformers import DataCollatorForTokenClassification

model = AutoModelForTokenClassification.from_pretrained('bert-base-cased', num_labels=9)  # BIO tags

def tokenize_and_align_labels(examples):
    tokenized_inputs = tokenizer(
        examples['tokens'],
        truncation=True,
        is_split_into_words=True
    )

    labels = []
    for i, label in enumerate(examples['ner_tags']):
        word_ids = tokenized_inputs.word_ids(batch_index=i)
        label_ids = []
        previous_word_idx = None

        for word_idx in word_ids:
            if word_idx is None:
                label_ids.append(-100)  # Ignore special tokens
            elif word_idx != previous_word_idx:
                label_ids.append(label[word_idx])
            else:
                label_ids.append(-100)  # Ignore subword tokens
            previous_word_idx = word_idx

        labels.append(label_ids)

    tokenized_inputs['labels'] = labels
    return tokenized_inputs
```

## LLM Integration & Prompt Engineering

**OpenAI API best practices:**
```python
from openai import OpenAI
from typing import Literal

client = OpenAI()

def generate_completion(
    prompt: str,
    model: str = 'gpt-4-turbo-preview',
    temperature: float = 0.7,
    max_tokens: int = 1000,
    system_prompt: str | None = None
) -> str:
    messages = []

    if system_prompt:
        messages.append({'role': 'system', 'content': system_prompt})

    messages.append({'role': 'user', 'content': prompt})

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=0.9,
        frequency_penalty=0.0,
        presence_penalty=0.0
    )

    return response.choices[0].message.content

# Structured output with function calling
def extract_entities(text: str) -> dict:
    functions = [
        {
            'name': 'extract_entities',
            'description': 'Extract named entities from text',
            'parameters': {
                'type': 'object',
                'properties': {
                    'persons': {'type': 'array', 'items': {'type': 'string'}},
                    'organizations': {'type': 'array', 'items': {'type': 'string'}},
                    'locations': {'type': 'array', 'items': {'type': 'string'}}
                },
                'required': ['persons', 'organizations', 'locations']
            }
        }
    ]

    response = client.chat.completions.create(
        model='gpt-4-turbo-preview',
        messages=[{'role': 'user', 'content': f'Extract entities from: {text}'}],
        functions=functions,
        function_call={'name': 'extract_entities'}
    )

    return eval(response.choices[0].message.function_call.arguments)

# RAG pattern
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(documents)

vectorstore = FAISS.from_documents(chunks, OpenAIEmbeddings())
retriever = vectorstore.as_retriever(search_kwargs={'k': 3})

def rag_query(query: str) -> str:
    relevant_docs = retriever.get_relevant_documents(query)
    context = '\n\n'.join([doc.page_content for doc in relevant_docs])

    prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {query}

Answer:"""

    return generate_completion(prompt, temperature=0.3)
```

## Text Preprocessing

**Production-grade preprocessing:**
```python
import re
from typing import Callable

def clean_text(text: str, lowercase: bool = True, remove_urls: bool = True) -> str:
    if remove_urls:
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)

    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)

    # Remove special characters (keep spaces and alphanumeric)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    if lowercase:
        text = text.lower()

    return text

# Advanced: custom tokenization
from tokenizers import Tokenizer, models, pre_tokenizers, trainers

# Train custom BPE tokenizer
tokenizer = Tokenizer(models.BPE())
tokenizer.pre_tokenizer = pre_tokenizers.Whitespace()

trainer = trainers.BpeTrainer(vocab_size=30000, special_tokens=['[PAD]', '[UNK]', '[CLS]', '[SEP]', '[MASK]'])
tokenizer.train_from_iterator(corpus, trainer=trainer)
```

## Best Practices

- **Use pre-trained models** - Transfer learning > training from scratch
- **Proper tokenization** - Handle subwords, padding, truncation correctly
- **Batch processing** - Tokenize and process in batches for efficiency
- **Mixed precision training** - Use fp16/bf16 for faster training on modern GPUs
- **Gradient accumulation** - Simulate larger batches when memory-limited
- **Learning rate warmup** - Stabilizes transformer training
- **Layer freezing** - Freeze early layers, train classifier first, then fine-tune

## Anti-Patterns

- Forgetting to set `model.eval()` during inference
- Not using attention masks (zeros out padding tokens)
- Training on raw text without proper tokenization
- Ignoring maximum sequence length (512 for BERT)
- Using wrong tokenizer for model
- Not normalizing embeddings for cosine similarity
- Overfitting on small datasets (use data augmentation, regularization)
