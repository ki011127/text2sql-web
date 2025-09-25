# echo "data_preprocess"
# python data_preprocess.py

# echo "generate question with EUCDISQUESTIONMASK"
# python generate_question.py \
# --data_type AI_HUB \
# --split test \
# --tokenizer gpt-3.5-turbo \
# --max_seq_len 4096 \
# --prompt_repr SQL \
# --k_shot 1 \
# --example_type QA \
# --selector_type  EUCDISQUESTIONMASK

# echo "generate SQL by GPT-4 for EUCDISMASKPRESKLSIMTHR as the pre-generated SQL query"
# python ask_llm.py \
# --openai_api_key $1  \
# --model gpt-3.5-turbo \
# --question ./dataset/process/AI_HUB-TEST_SQL_1-SHOT_EUCDISQUESTIONMASK_QA-EXAMPLE_CTX-200_ANS-4096/

# echo "generate question with EUCDISMASKPRESKLSIMTHR"
# python generate_question.py \
# --data_type AI_HUB \
# --split test \
# --tokenizer gpt-3.5-turbo \
# --max_seq_len 4096 \
# --selector_type EUCDISMASKPRESKLSIMTHR \
# --pre_test_result ./dataset/process/AI_HUB-TEST_SQL_1-SHOT_EUCDISQUESTIONMASK_QA-EXAMPLE_CTX-200_ANS-4096/RESULTS_MODEL-gpt-3.5-turbo.txt \
# --prompt_repr SQL \
# --k_shot 1 \
# --example_type QA

echo "generate SQL by GPT-4 for EUCDISMASKPRESKLSIMTHR"
python ask_llm.py \
--openai_api_key $1  \
--model gpt-3.5-turbo \
--question ./dataset/process/AI_HUB-TEST_SQL_1-SHOT_EUCDISMASKPRESKLSIMTHR_QA-EXAMPLE_CTX-200_ANS-4096/ \
--sql_error
