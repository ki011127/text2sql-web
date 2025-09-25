import json

with open("/home/tako/kitae/DAIL-SQL/dataset/process/AI_HUB-TEST_SQL_9-SHOT_EUCDISQUESTIONMASK_QA-EXAMPLE_CTX-200_ANS-4096/questions.json", 'r', encoding='utf-8') as f:
    content = json.load(f)
    print(content["questions"][0])