/* osce.js — OSCE checklists: ordered procedure steps (with the critical ones marked) + a "test me" mode (choose the next step) + the anatomy of a step on the 3D model.
   DRAFT clinical / nursing / physiotherapy content — must be reviewed by a clinician / educator before relying on it. */
'use strict';
/* each procedure: f = faculties, t = title en|ar, sc = scenario en|ar, st = steps [text en|ar, critical 0/1, why en|ar, show regexes (optional)], bad = unsafe / wrong actions en|ar (used as distractors) */
const OS = [
  { id: 'iv', f: ['nurs', 'med'], t: 'Peripheral IV cannulation|تركيب كانيولا وريدية', sc: 'Insert a peripheral IV cannula in an adult patient who needs IV fluids.|ركّب كانيولا وريدية لمريض بالغ محتاج محاليل.',
    st: [['Wash hands, check the order and the patient\'s identity, explain and get consent|اغسل إيديك وراجع الأمر وهوية المريض واشرح واحصل على الموافقة', 1, 'Identity and consent errors are critical safety failures.|أخطاء الهوية والموافقة من أخطاء السلامة الحرجة.'],
      ['Gather and check the equipment (cannula, dressing, flush, tourniquet, gloves)|جهّز وراجع الأدوات (كانيولا، لاصق، سيرنجة غسيل، تورنيكيه، جوانتي)', 0, ''],
      ['Choose the site: a straight, soft vein in the non-dominant forearm, avoiding a fistula arm and the antecubital pulse|اختار المكان: وريد مستقيم وطري في ساعد اليد غير المسيطرة، وتجنب دراع الناسور ونبض الحفرة المرفقية', 1, 'The brachial artery and median nerve lie close to the antecubital veins.|الشريان العضدي والعصب الأوسط قريبين من أوردة الحفرة المرفقية.', ['^Cephalic vein', '^Basilic vein', '^Median cubital vein', '^Brachial artery']],
      ['Apply the tourniquet 10 cm above the site and put on gloves|اربط التورنيكيه 10 سم فوق المكان والبس جوانتي', 0, ''],
      ['Clean the skin with an antiseptic and let it dry|نضّف الجلد بمطهر واسيبه يجف', 1, 'Wet antiseptic stings and is less effective.|المطهر الرطب مش فعال وبيحرق.'],
      ['Insert the cannula bevel up at about 15–30°, watch for the flashback, then advance the catheter|ادخل الكانيولا والشطفة لفوق بزاوية 15–30 درجة، استنى رجوع الدم وبعدين ادفع الكاتيتر', 1, 'Flashback confirms the vein is entered.|رجوع الدم بيأكد دخول الوريد.'],
      ['Release the tourniquet, press over the vein tip, remove the needle into the sharps box|فك التورنيكيه واضغط على طرف الوريد وارمي الإبرة في صندوق الحاد', 1, 'Prevents bleeding and needle-stick injury.|بيمنع النزيف وإصابة الإبرة.'],
      ['Flush with saline, check there is no swelling or pain, then secure and label the dressing|اغسل بالمحلول وتأكد من عدم وجود ورم أو ألم وبعدين ثبّت واكتب التاريخ على اللاصق', 0, ''],
      ['Dispose of waste, wash hands and document|تخلص من المخلفات واغسل إيديك وسجّل', 0, '']],
    bad: ['Re-sheath the used needle with both hands|رجّع الغطا على الإبرة المستعملة بإيدين', 'Insert straight into the pulsating vessel in the antecubital fossa|ادخل في الوعاء اللي بينبض في الحفرة المرفقية', 'Use the arm with the dialysis fistula|استخدم دراع الناسور', 'Skip identity check to save time|اتخطى التأكد من الهوية توفيرا للوقت'] },
  { id: 'bp', f: ['nurs', 'med'], t: 'Blood pressure measurement|قياس ضغط الدم', sc: 'Measure the blood pressure of a seated adult with a manual sphygmomanometer.|قيس ضغط مريض قاعد بجهاز زئبق/عقرب.',
    st: [['Introduce yourself, confirm identity, explain, wash hands|عرّف نفسك وتأكد من الهوية واشرح واغسل إيديك', 1, 'Standard start of every OSCE station.|بداية معيارية لأي محطة.'],
      ['Seat the patient with the arm supported at heart level, back supported, legs uncrossed, rested for 5 minutes|اقعّد المريض والدراع مسنود على مستوى القلب والضهر مسنود والرجلين مش مكتوفين بعد راحة 5 دقايق', 1, 'Arm below heart level falsely raises the reading.|نزول الدراع تحت القلب بيرفع القراءة غلط.'],
      ['Choose the correct cuff size and place it with its centre over the brachial artery, lower edge 2–3 cm above the elbow crease|اختار حجم الكيس المناسب وحطه ومنتصفه فوق الشريان العضدي وحافته السفلية 2–3 سم فوق ثنية الكوع', 1, 'A cuff that is too small overestimates the pressure.|كيس صغير بيدّي قراءة أعلى من الحقيقة.', ['^Brachial artery', '^Biceps brachii']],
      ['Palpate the radial pulse and inflate until it disappears (estimate of systolic)|حس النبض الكعبري وانفخ لحد ما يختفي (تقدير للانقباضي)', 0, 'Avoids missing an auscultatory gap.|بيمنع تفويت الفجوة السماعية.', ['^Radial artery']],
      ['Deflate, wait, then place the stethoscope over the brachial artery|فرّغ واستنى وبعدين حط السماعة على الشريان العضدي', 0, ''],
      ['Inflate 20–30 mmHg above the palpated systolic, then deflate at 2–3 mmHg per second|انفخ 20–30 فوق الانقباضي المحسوس وبعدين فرّغ بمعدل 2–3 ملم زئبق في الثانية', 1, 'Too fast deflation under-reads the pressure.|التفريغ السريع بيقلل القراءة.'],
      ['Record systolic at the first Korotkoff sound and diastolic at its disappearance|سجّل الانقباضي عند أول صوت كوروتكوف والانبساطي عند اختفائه', 1, 'Core of the technique.|لب الاختبار.'],
      ['Deflate fully, remove the cuff, tell the patient the result, document, repeat in the other arm if indicated|فرّغ كامل وشيل الكيس وقول النتيجة للمريض وسجّلها وأعد في الدراع التاني لو لزم', 0, '']],
    bad: ['Measure with the arm hanging by the side|قيس والدراع نازل جنب الجسم', 'Place the cuff over clothing|حط الكيس فوق الهدوم', 'Deflate as fast as possible|فرّغ بأقصى سرعة', 'Use the same small cuff for all patients|استخدم نفس الكيس الصغير لكل المرضى'] },
  { id: 'cpr', f: ['nurs', 'med'], t: 'Adult basic life support|الإنعاش القلبي الرئوي الأساسي للبالغ', sc: 'You find an adult collapsed on the ward floor.|لقيت مريض بالغ واقع على أرض العنبر.',
    st: [['Check the scene is safe|اتأكد إن المكان آمن', 1, 'You must not become a second casualty.|متبقاش إنت المصاب التاني.'],
      ['Check responsiveness: shake gently and shout|اتأكد من الاستجابة: هزّه بلطف وناديه', 1, ''],
      ['Shout for help and call the resuscitation team / ask for a defibrillator|نادي مساعدة واطلب فريق الإنعاش وجهاز الصدمات', 1, ''],
      ['Open the airway and check breathing for no more than 10 seconds|افتح المجرى الهوائي وافحص التنفس في مدة لا تزيد عن 10 ثواني', 1, 'Agonal gasps are not normal breathing.|الشهقات المحتضرة مش تنفس طبيعي.'],
      ['Start chest compressions: heel of the hand on the lower half of the sternum, 5–6 cm deep, 100–120 per minute|ابدأ ضغطات الصدر: كعب اليد على النص السفلي للقص، عمق 5–6 سم، 100–120 في الدقيقة', 1, 'Compressions over the xiphoid risk injury and are ineffective.|الضغط على الزائدة السيفية مش فعال وخطر.', ['^Body of sternum', '^Xiphoid process', '^Left ventricle$']],
      ['Give 2 rescue breaths after 30 compressions if trained and equipment is available|اعمل نفسين إنقاذ بعد كل 30 ضغطة لو متدرب ومعاك الأدوات', 0, ''],
      ['Attach the AED as soon as it arrives and follow its prompts|وصّل جهاز الصدمات أول ما يوصل واتبع تعليماته', 1, 'Early defibrillation improves survival in shockable rhythms.|الصدمة المبكرة بتحسّن النجاة في الإيقاعات القابلة للصدمة.'],
      ['Continue until help takes over, the patient wakes, or you are told to stop; swap compressors every 2 minutes|كمّل لحد ما الفريق يستلم أو المريض يفوق أو يتقال لك وقّف؛ بدّل اللي بيضغط كل دقيقتين', 0, ''],
      ['Hand over using a structured report (SBAR) and document|سلّم بتقرير منظم (SBAR) وسجّل', 0, '']],
    bad: ['Check the pulse for a full minute before starting|ابحث عن النبض دقيقة كاملة قبل ما تبدأ', 'Compress only 2 cm deep to avoid rib fractures|اضغط 2 سم بس عشان متكسرش الضلوع', 'Stop compressions to look for a blood pressure|وقّف الضغطات تدوّر على ضغط', 'Compress over the upper abdomen|اضغط على أعلى البطن'] },
  { id: 'im', f: ['nurs'], t: 'Intramuscular injection (ventrogluteal)|حقنة عضل (الموضع البطني الإلوي)', sc: 'Give a prescribed IM injection to an adult.|اديه حقنة عضل مكتوبة لمريض بالغ.',
    st: [['Verify the order, the drug, dose, route, time, allergy and the patient\'s identity (the 5–6 rights)|راجع الأمر والدوا والجرعة والطريق والوقت والحساسية وهوية المريض (الحقوق الخمسة/الستة)', 1, 'Medication errors are the most serious failure here.|أخطاء الدوا أخطر خطأ هنا.'],
      ['Wash hands, prepare the drug, check the expiry date and label|اغسل إيديك وجهّز الدوا وراجع الصلاحية والملصق', 1, ''],
      ['Position the patient on the side or supine and expose the site|وضّع المريض على جنبه أو على ضهره واكشف المكان', 0, ''],
      ['Locate the ventrogluteal site: palm on the greater trochanter, index finger on the ASIS, middle finger along the iliac crest – inject in the V|حدد الموضع البطني الإلوي: الكف على المدور الكبير والسبابة على الشوكة الحرقفية الأمامية والوسطى على العرف – احقن في حرف V', 1, 'Thick gluteus medius/minimus, away from the sciatic nerve.|عضلات إلوية سميكة وبعيدة عن العصب الوركي.', ['^Gluteus medius$', '^Gluteus minimus$', '^Sciatic nerve$', '^Hip bone']],
      ['Clean the skin and let it dry|نضّف الجلد واسيبه يجف', 0, ''],
      ['Stretch the skin, insert the needle quickly at 90°, aspirate if your policy requires, inject slowly|شد الجلد وادخل الإبرة بسرعة بزاوية 90 درجة واسحب (حسب البروتوكول) واحقن ببطء', 1, ''],
      ['Withdraw the needle, apply gentle pressure, and dispose of it in the sharps box without re-sheathing|اسحب الإبرة واضغط بلطف وارميها في صندوق الحاد من غير تغطية', 1, 'Re-sheathing causes needle-stick injury.|إعادة الغطا بتسبب وخز الإبرة.'],
      ['Make the patient comfortable and watch for reactions|ريّح المريض وراقب أي تفاعل', 0, ''],
      ['Wash hands and document the dose, site and time|اغسل إيديك وسجّل الجرعة والمكان والوقت', 0, '']],
    bad: ['Inject in the upper inner buttock|احقن في الجزء العلوي الداخلي من الإلية', 'Re-sheath the needle with both hands|غطّي الإبرة بإيدين', 'Skip the allergy question|اتخطى سؤال الحساسية', 'Inject quickly to reduce pain|احقن بسرعة عشان الألم يقل'] },
  { id: 'ngt', f: ['nurs'], t: 'Nasogastric tube insertion|تركيب أنبوبة أنفية معدية', sc: 'Insert a nasogastric tube for enteral feeding in a conscious adult.|ركّب أنبوبة أنفية معدية للتغذية لمريض بالغ فايق.',
    st: [['Check the order, identity, explain the procedure and obtain consent|راجع الأمر والهوية واشرح واحصل على الموافقة', 1, ''],
      ['Position the patient upright (semi-Fowler / sitting) with the neck slightly flexed|وضّع المريض قاعد (نص جلوس) والرقبة مثنية شوية', 0, ''],
      ['Measure the tube: nose to earlobe to xiphoid process (NEX) and mark it|قيس الأنبوبة: من الأنف للودن لسيف القص (NEX) وعلّم عليها', 1, 'Gives the correct insertion length.|بيدّي الطول الصح للإدخال.', ['^Esophagus', '^Stomach', '^Trachea', '^Xiphoid process']],
      ['Lubricate the tip and insert along the floor of the nostril, directing backwards|زلّق الطرف وادخل على أرضية المنخر في اتجاه الخلف', 0, ''],
      ['Ask the patient to swallow sips of water as the tube passes the pharynx|اطلب من المريض يبلع رشفات ماء وقت عبور البلعوم', 1, 'Helps direct the tube into the oesophagus, not the airway.|بتوجّه الأنبوبة للمريء مش للمجرى الهوائي.'],
      ['Stop and withdraw if there is coughing, cyanosis or breathlessness|وقّف واسحب لو فيه كحة أو زرقة أو ضيق نفس', 1, 'Signs of airway placement.|علامات دخول المجرى الهوائي.'],
      ['Confirm position: aspirate and test the pH (≤ 5.5); X-ray if unsure|اتأكد من المكان: اسحب واختبر الحموضة (≤ 5.5)، وأشعة لو مش متأكد', 1, 'Never feed through an unconfirmed tube.|متغذيش من أنبوبة مش متأكد من مكانها.'],
      ['Secure the tube and record the length at the nostril|ثبّت الأنبوبة وسجّل الطول عند المنخر', 0, ''],
      ['Wash hands and document|اغسل إيديك وسجّل', 0, '']],
    bad: ['Confirm placement by listening to air injected over the stomach only|اتأكد من المكان بسماع الهوا فوق المعدة بس', 'Insert with the patient lying flat and the neck extended|ركّب والمريض نايم والرقبة ممدودة', 'Start feeding before checking the position|ابدأ التغذية قبل التأكد من المكان', 'Force the tube against resistance|اضغط على الأنبوبة وقت المقاومة'] },
  { id: 'cath', f: ['nurs'], t: 'Urinary catheterisation (adult)|تركيب قسطرة بولية (بالغ)', sc: 'Insert an indwelling urethral catheter using an aseptic technique.|ركّب قسطرة بولية دائمة بتعقيم.',
    st: [['Check the indication and order, identity, explain, obtain consent and ensure privacy|راجع الاستطباب والأمر والهوية واشرح واحصل على الموافقة وحافظ على الخصوصية', 1, ''],
      ['Wash hands, prepare the sterile trolley and check the catheter size and balloon|اغسل إيديك وجهّز الترولي المعقم وراجع مقاس القسطرة والبالون', 0, ''],
      ['Position the patient and clean the meatus with sterile saline using the non-dominant (dirty) hand to hold the genitalia|وضّع المريض ونضّف فتحة الإحليل بمحلول معقم وامسك الأعضاء باليد غير المعقمة', 1, 'Keeps the sterile hand sterile.|بتحافظ على اليد المعقمة.'],
      ['Apply lubricating (anaesthetic) gel to the urethra and wait|حط جل مزلق (مخدر) في الإحليل واستنى', 0, ''],
      ['Insert the catheter gently (male: hold the penis upright; female: about 5 cm) until urine flows, then advance a little more|ادخل القسطرة بلطف (الرجل: القضيب لفوق؛ الست: حوالي 5 سم) لحد نزول البول وكمّل شوية', 1, 'The male urethra is about 18–20 cm; the female about 4 cm.|إحليل الرجل حوالي 18–20 سم والست حوالي 4 سم.', ['^Urethra', '^Urinary bladder', '^Prostate']],
      ['Inflate the balloon only after urine is seen and the catheter is fully inserted|انفخ البالون بعد ظهور البول وتمام إدخال القسطرة بس', 1, 'Inflating inside the urethra causes serious injury.|النفخ جوه الإحليل بيسبب إصابة خطيرة.'],
      ['Gently pull back until resistance, connect the drainage bag, secure the tube|اسحب بلطف لحد المقاومة ووصّل كيس التجميع وثبّت الأنبوبة', 0, ''],
      ['In an uncircumcised male, replace the foreskin|في الرجل غير المختون رجّع الجلدة لمكانها', 1, 'Otherwise paraphimosis may result.|وإلا ممكن يحصل ضيق للجلدة (باراففيموزيس).'],
      ['Dispose of waste, wash hands, document|تخلص من المخلفات واغسل إيديك وسجّل', 0, '']],
    bad: ['Inflate the balloon as soon as resistance is felt|انفخ البالون أول ما تحس بمقاومة', 'Force the catheter through resistance|اضغط بالقسطرة على المقاومة', 'Use a non-sterile technique to save time|استخدم أسلوب غير معقم توفيرا للوقت', 'Leave the foreskin retracted|سيب الجلدة مرجّعة لورا'] },
  { id: 'insulin', f: ['nurs'], t: 'Subcutaneous insulin injection|حقن الإنسولين تحت الجلد', sc: 'Give subcutaneous insulin to a diabetic patient and teach the technique.|اعطي إنسولين تحت الجلد لمريض سكر وعلّمه الطريقة.',
    st: [['Check the insulin type, dose, time, expiry and the patient\'s blood glucose|راجع نوع الإنسولين والجرعة والوقت والصلاحية وسكر المريض', 1, 'Insulin is a high-alert medication.|الإنسولين دوا عالي الخطورة.'],
      ['Wash hands and prepare the pen/syringe; mix cloudy insulin gently|اغسل إيديك وجهّز القلم أو السرنجة وقلّب الإنسولين العكر بلطف', 0, ''],
      ['Choose the abdomen at least 2 cm from the umbilicus, away from lumps and scars; rotate sites|اختار البطن بعيد 2 سم عن السرة وبعيد عن الكتل والندبات وغيّر المكان', 1, 'Rotation prevents lipohypertrophy and erratic absorption.|تغيير المكان بيمنع تضخم الدهن وامتصاص غير منتظم.', ['^Rectus abdominis']],
      ['Clean the site if required and let it dry|نضّف المكان لو لزم واسيبه يجف', 0, ''],
      ['Pinch a skin fold and insert the short needle at 90°|اقرص ثنية جلد وادخل الإبرة القصيرة بزاوية 90 درجة', 1, 'Delivers insulin into the fat, not the muscle.|بيوصّل الإنسولين للدهن مش للعضل.'],
      ['Inject, hold for about 10 seconds, then withdraw|احقن وانتظر حوالي 10 ثواني وبعدين اسحب', 0, ''],
      ['Dispose of the needle safely and do not rub the site|ارمي الإبرة بأمان ومتدعكش المكان', 1, ''],
      ['Ensure the patient eats as planned and recognises hypoglycaemia symptoms|اتأكد إن المريض ياكل زي المخطط وإنه عارف أعراض الهبوط', 1, ''],
      ['Document the dose, site and time|سجّل الجرعة والمكان والوقت', 0, '']],
    bad: ['Inject into the same lump every day|احقن في نفس الكتلة كل يوم', 'Inject deep into the muscle|احقن عميق في العضل', 'Skip glucose checking|اتخطى قياس السكر', 'Rub the site vigorously afterwards|دعك المكان بقوة بعد الحقن'] },
  { id: 'cvs', f: ['med'], t: 'Cardiovascular examination|فحص القلب والأوعية', sc: 'Examine the cardiovascular system of an adult patient.|افحص الجهاز القلبي الوعائي لمريض بالغ.',
    st: [['Introduce, wash hands, get consent, expose the chest, position at 45°|عرّف نفسك واغسل إيديك وخد الموافقة واكشف الصدر ووضّع المريض 45 درجة', 1, ''],
      ['General inspection and hands: colour, clubbing, splinter haemorrhages, capillary refill|معاينة عامة واليدين: اللون والتعجّر والنزيف الشظوي وإعادة امتلاء الشعيرات', 0, ''],
      ['Radial pulse: rate, rhythm, then radio-radial delay; blood pressure|النبض الكعبري: المعدل والانتظام وبعدها تأخر الكعبري–الكعبري؛ والضغط', 1, '', ['^Radial artery']],
      ['Face and neck: eyes, mouth, then JVP at 45°, carotid pulse one side at a time|الوش والرقبة: العينين والفم وبعدها الوريد الوداجي JVP على 45 درجة والنبض السباتي كل ناحية لوحدها', 1, 'Never palpate both carotids together.|متحسّش السباتيين مع بعض.', ['^Internal jugular vein', 'common carotid']],
      ['Inspect the precordium (scars, deformity, visible apex)|عاين منطقة القلب (ندبات وتشوه وقمة ظاهرة)', 0, ''],
      ['Palpate the apex beat (5th left intercostal space, midclavicular line), heaves and thrills|حس نبضة القمة (الفراغ الضلعي الخامس الأيسر على الخط الترقوي) والارتجاجات', 1, '', ['^Left ventricle$', '^Right ventricle$']],
      ['Auscultate the four areas with the diaphragm and bell while feeling the carotid pulse|اسمع المناطق الأربعة بالغشاء والجرس مع حس النبض السباتي', 1, ''],
      ['Auscultate for radiation to the carotids and axilla; sit forward for aortic regurgitation|اسمع الانتشار للسباتيين والإبط؛ واقعده لقدام لاستبعاد ارتجاع الأورطي', 0, ''],
      ['Check for sacral and ankle oedema, peripheral pulses, and finish by thanking the patient|افحص الاستسقاء العجزي والكاحلين والنبض الطرفي واختم بشكر المريض', 0, '']],
    bad: ['Palpate both carotid arteries at once|حس السباتيين مع بعض', 'Auscultate before introducing yourself|اسمع قبل ما تعرّف نفسك', 'Listen only at the apex|اسمع عند القمة بس', 'Skip checking for oedema|اتخطى فحص الاستسقاء'] },
  { id: 'resp', f: ['med'], t: 'Respiratory examination|فحص الجهاز التنفسي', sc: 'Examine the chest of an adult patient with cough and breathlessness.|افحص صدر مريض بالغ عنده كحة وضيق نفس.',
    st: [['Introduce, wash hands, consent, expose the chest, sit the patient at 45°|عرّف نفسك واغسل إيديك وخد الموافقة واكشف الصدر وقعّد المريض 45 درجة', 1, ''],
      ['General inspection: respiratory rate, work of breathing, cyanosis, sputum pot, oxygen|معاينة عامة: معدل التنفس ومجهود التنفس والزرقة والبصاق والأكسجين', 0, ''],
      ['Hands, wrist (flap) and face: clubbing, tar staining, anaemia, central cyanosis|اليدين والرسغ والوش: التعجّر وتبقع النيكوتين والأنيميا والزرقة المركزية', 0, ''],
      ['Neck: trachea position, lymph nodes, JVP|الرقبة: مكان القصبة والعقد والـJVP', 1, 'Tracheal deviation suggests pleural or mediastinal pathology.|انحراف القصبة بيدل على مرض في الجنب أو المنصف.', ['^Trachea']],
      ['Chest inspection: shape, scars, symmetry of movement|معاينة الصدر: الشكل والندبات وتماثل الحركة', 0, ''],
      ['Palpation: expansion (upper and lower) and tactile vocal fremitus|الجس: التمدد (علوي وسفلي) والرجفان اللمسي', 1, ''],
      ['Percussion: compare both sides in the upper, middle and lower zones, front and back|القرع: قارن الناحيتين في المناطق العلوية والوسطى والسفلية من قدام ومن ورا', 1, '', ['^Right lung', '^Left lung']],
      ['Auscultation: breath sounds, added sounds and vocal resonance, front and back|السماع: أصوات التنفس والأصوات المضافة والرنين الصوتي من قدام ومن ورا', 1, '', ['^Right lung', '^Left lung']],
      ['Finish: thank the patient, wash hands, summarise the findings|اختم: اشكر المريض واغسل إيديك ولخّص النتايج', 0, '']],
    bad: ['Percuss one side only|اقرع ناحية واحدة بس', 'Auscultate through the clothes|اسمع من فوق الهدوم', 'Examine the front only|افحص من قدام بس', 'Skip checking the trachea|اتخطى فحص القصبة'] },
  { id: 'abd', f: ['med'], t: 'Abdominal examination|فحص البطن', sc: 'Examine the abdomen of an adult with abdominal pain.|افحص بطن مريض بالغ عنده ألم في البطن.',
    st: [['Introduce, wash hands, consent, ask about pain, lie the patient flat with one pillow, expose from nipples to knees|عرّف نفسك واغسل إيديك وخد الموافقة واسأل عن الألم ونيّم المريض ومخدة واحدة واكشف من الحلمتين للركبتين', 1, ''],
      ['Inspect from the end of the bed: distension, scars, pulsation, hernias|عاين من آخر السرير: الانتفاخ والندبات والنبض والفتق', 0, ''],
      ['Ask the patient to point to the pain and examine that area last; watch the face|اطلب من المريض يشاور على الألم وافحص المنطقة دي في الآخر وراقب وشه', 1, ''],
      ['Light palpation of all nine regions|جس خفيف للمناطق التسع', 1, ''],
      ['Deep palpation, then liver, spleen and kidneys|جس عميق وبعدها الكبد والطحال والكلى', 1, '', ['^Liver', '^Spleen', '^Kidney', '^Stomach']],
      ['Palpate for the aorta and masses; check for ascites with percussion/shifting dullness|حس الأورطي والكتل وافحص الاستسقاء بالقرع/الصمم المتنقل', 0, '', ['^Abdominal aorta']],
      ['Auscultate for bowel sounds (and renal bruits if indicated)|اسمع أصوات الأمعاء (وأصوات الكلى لو لزم)', 0, ''],
      ['Offer to examine the hernial orifices, genitalia and do a rectal examination|اعرض فحص مناطق الفتق والأعضاء التناسلية والفحص الشرجي', 0, ''],
      ['Cover the patient, thank them, wash hands and summarise|غطّي المريض واشكره واغسل إيديك ولخّص', 0, '']],
    bad: ['Start palpation over the most painful spot|ابدأ الجس من أكتر مكان بيوجع', 'Auscultate only after deep palpation without reason|اسمع بعد الجس العميق من غير سبب', 'Expose only the painful area|اكشف مكان الألم بس', 'Skip asking about pain|اتخطى السؤال عن الألم'] },
  { id: 'uln', f: ['med', 'pt'], t: 'Upper limb neurological examination|الفحص العصبي للطرف العلوي', sc: 'Examine the nervous system of the upper limb in a patient with weakness.|افحص الجهاز العصبي للطرف العلوي لمريض عنده ضعف.',
    st: [['Introduce, wash hands, consent, expose both arms and position the patient|عرّف نفسك واغسل إيديك وخد الموافقة واكشف الدراعين ووضّع المريض', 1, ''],
      ['Inspect for wasting, fasciculations, deformity and posture|عاين الضمور والرعشات العضلية والتشوه والوضع', 1, ''],
      ['Tone: at the elbow and wrist, then pronator drift|الشد العضلي: عند الكوع والرسغ وبعدها انجراف الكب', 0, ''],
      ['Power: shoulder, elbow, wrist, finger and thumb movements graded 0–5 (MRC)|القوة: حركات الكتف والكوع والرسغ والأصابع والإبهام بالدرجات 0–5 (MRC)', 1, 'Compare with the other side.|قارن بالناحية التانية.', ['^Radial nerve$', '^Median nerve', '^Ulnar nerve', '^Musculocutaneous']],
      ['Reflexes: biceps (C5–6), brachioradialis (C6), triceps (C7)|المنعكسات: الثنائية (C5–6) والعضدية الكعبرية (C6) والثلاثية (C7)', 1, ''],
      ['Sensation: light touch and pinprick by dermatome and peripheral nerve|الإحساس: اللمس الخفيف والوخز حسب الجذر والعصب', 1, ''],
      ['Coordination: finger–nose and rapid alternating movements|التناسق: إصبع–أنف والحركات المتبادلة السريعة', 0, ''],
      ['Special tests if indicated (Tinel, Phalen, Froment)|اختبارات خاصة لو لزم (تينل وفالن وفرومنت)', 0, ''],
      ['Thank the patient, wash hands and summarise: upper vs lower motor neuron, root vs peripheral nerve|اشكر المريض واغسل إيديك ولخّص: عصب علوي أم سفلي، جذر أم عصب طرفي', 0, '']],
    bad: ['Test power only on the affected side|اختبر القوة في الناحية المصابة بس', 'Skip comparing both sides|اتخطى المقارنة بين الناحيتين', 'Test reflexes before inspecting|اختبر المنعكسات قبل المعاينة', 'Test sensation without explaining|اختبر الإحساس من غير شرح'] },
  { id: 'knee', f: ['pt'], t: 'Knee examination|فحص الركبة', sc: 'Examine the knee of a patient with a twisting injury.|افحص ركبة مريض عنده إصابة التواء.',
    st: [['Introduce, consent, expose both knees fully, ask about pain, observe the gait|عرّف نفسك وخد الموافقة واكشف الركبتين تماما واسأل عن الألم وراقب المشية', 1, ''],
      ['Look: swelling, bruising, deformity, quadriceps wasting, alignment|عاين: الورم والكدمات والتشوه وضمور الرباعية والمحاذاة', 0, ''],
      ['Feel: temperature, effusion (patellar tap / sweep), joint line and bony tenderness|حس: الحرارة والانصباب (نقر الرضفة/المسح) وألم خط المفصل والعظم', 1, '', ['^Patella', '^Medial meniscus', '^Lateral meniscus']],
      ['Move: active then passive flexion and extension, and compare the sides|الحركة: ثني وفرد نشط وبعدها سلبي وقارن الناحيتين', 1, ''],
      ['Collateral ligaments: valgus and varus stress at 0° and 30°|الأربطة الجانبية: إجهاد أروح وأفحج عند 0 و30 درجة', 1, '', ['^Medial collateral', '^Lateral collateral']],
      ['Cruciate ligaments: Lachman, anterior and posterior drawer|الأربطة الصليبية: لاكمان والسحب الأمامي والخلفي', 1, 'Lachman is the most sensitive for the ACL.|لاكمان أحس اختبار للصليبي الأمامي.', ['^Anterior cruciate', '^Posterior cruciate']],
      ['Menisci: McMurray or Thessaly test|الغضاريف الهلالية: اختبار ماكموراي أو ثيسالي', 1, '', ['^Medial meniscus', '^Lateral meniscus']],
      ['Examine the patellofemoral joint and the hip and ankle above and below|افحص مفصل الرضفة الفخذي والورك والكاحل فوق وتحت', 0, ''],
      ['Thank the patient and summarise the findings|اشكر المريض ولخّص النتايج', 0, '']],
    bad: ['Do the McMurray test before looking and feeling|اعمل ماكموراي قبل المعاينة والجس', 'Examine only the painful knee, no comparison|افحص الركبة المؤلمة بس من غير مقارنة', 'Skip the hip examination|اتخطى فحص الورك', 'Force the joint beyond pain without warning|اضغط على المفصل لأبعد من الألم من غير تحذير'] },
  { id: 'shoulder', f: ['pt'], t: 'Shoulder examination|فحص الكتف', sc: 'Examine the shoulder of a patient with pain on lifting the arm.|افحص كتف مريض عنده ألم لما بيرفع دراعه.',
    st: [['Introduce, consent, expose both shoulders, ask about pain and handedness|عرّف نفسك وخد الموافقة واكشف الكتفين واسأل عن الألم واليد المسيطرة', 1, ''],
      ['Look from front, side and back: asymmetry, wasting, winging, scars|عاين من قدام وجنب وورا: عدم التماثل والضمور والتجنيح والندبات', 0, ''],
      ['Feel: sternoclavicular, acromioclavicular joints, bicipital groove, greater tuberosity|حس: المفصلين القصي الترقوي والأخرمي الترقوي والميزاب ذو الرأسين والحدبة الكبرى', 1, ''],
      ['Move: active and passive flexion, abduction, external and internal rotation; note the painful arc|الحركة: ثني وفتح ودوران خارجي وداخلي نشط وسلبي مع ملاحظة قوس الألم', 1, '', ['^Deltoid', '^Supraspinatus']],
      ['Rotator-cuff tests: empty can (supraspinatus), external rotation (infraspinatus), belly press / lift-off (subscapularis)|اختبارات الكفة المدورة: العلبة الفاضية وما تحت الشوكة والضغط على البطن', 1, '', ['^Supraspinatus', '^Infraspinatus', '^Subscapularis']],
      ['Impingement tests: Neer and Hawkins–Kennedy|اختبارات الاصطدام: نير وهوكنز-كينيدي', 0, ''],
      ['Instability and AC tests: apprehension, cross-body adduction|اختبارات عدم الثبات والأخرمي: القلق وضم الدراع عبر الجسم', 0, ''],
      ['Examine the neck and neurovascular status of the arm|افحص الرقبة والحالة العصبية الوعائية للدراع', 1, 'Neck pain can refer to the shoulder.|ألم الرقبة ممكن يتنقل للكتف.'],
      ['Thank the patient and summarise|اشكر المريض ولخّص', 0, '']],
    bad: ['Test the shoulder without examining the neck|اختبر الكتف من غير فحص الرقبة', 'Start with resisted tests before looking|ابدأ بالاختبارات ضد المقاومة قبل المعاينة', 'Move the painful arm passively with force|حرّك الدراع المؤلم بقوة', 'Skip comparing the other side|اتخطى مقارنة الناحية التانية'] },
  { id: 'ankle', f: ['pt'], t: 'Ankle injury assessment (Ottawa rules)|تقييم إصابة الكاحل (قواعد أوتاوا)', sc: 'Assess an acute inversion injury of the ankle.|قيّم إصابة تقليب حادة في الكاحل.',
    st: [['Introduce, consent, history: mechanism, ability to weight-bear, previous sprains|عرّف نفسك وخد الموافقة والتاريخ: آلية الإصابة والقدرة على التحميل والالتواءات السابقة', 1, ''],
      ['Look: swelling, bruising, deformity, compare both feet|عاين: الورم والكدمات والتشوه وقارن القدمين', 0, ''],
      ['Palpate the posterior edge of both malleoli, the base of the 5th metatarsal and the navicular|حس الحافة الخلفية للكعبين وقاعدة المشطية الخامسة والزورقي', 1, 'Bone tenderness at these sites, or inability to take 4 steps, calls for an X-ray.|ألم العظم في الأماكن دي أو عدم القدرة على 4 خطوات معناه أشعة.', ['^Fibula', '^Tibia', '^Talus', '^Calcaneus', '^Navicular']],
      ['Ask the patient to take four steps|اطلب من المريض يمشي 4 خطوات', 1, ''],
      ['Palpate the ATFL, CFL and deltoid ligament|حس الرباط الشظوي الكاحلي الأمامي والعقبي الشظوي والدالي', 1, '', ['^Anterior talofibular', '^Calcaneofibular', '^Deltoid ligament']],
      ['Anterior drawer and talar tilt tests (if no fracture suspected)|اختبار السحب الأمامي وميل الكاحلية (لو مفيش اشتباه كسر)', 1, ''],
      ['Squeeze test for the syndesmosis and check the proximal fibula|اختبار الضغط للارتفاق وافحص رأس الشظية', 0, ''],
      ['Check the pulses (dorsalis pedis, posterior tibial) and sensation|افحص النبض (ظهر القدم والظنبوبي الخلفي) والإحساس', 1, '', ['^Dorsalis pedis', '^Posterior tibial artery']],
      ['Advise: protect, early loading, X-ray if Ottawa positive; thank the patient|انصح: حماية وتحميل مبكر وأشعة لو أوتاوا إيجابي؛ واشكر المريض', 0, '']],
    bad: ['Do the talar tilt before excluding a fracture|اعمل اختبار الميل قبل استبعاد الكسر', 'Skip checking the pulses|اتخطى فحص النبض', 'Ask for an X-ray in every case|اطلب أشعة في كل الحالات', 'Palpate only the painful side of the joint|حس ناحية الألم بس'] },
  { id: 'lumbar', f: ['pt'], t: 'Lumbar spine and lower-limb neurological examination|فحص أسفل الضهر والجهاز العصبي للطرف السفلي', sc: 'Examine a patient with low-back pain radiating down the leg.|افحص مريض عنده ألم أسفل الضهر ممتد للرجل.',
    st: [['Introduce, consent, red-flag screen (saddle numbness, bladder/bowel change, weakness, fever, weight loss)|عرّف نفسك وخد الموافقة واسأل علامات الخطر (تنميل السرج، تغيير مثانة/أمعاء، ضعف، حرارة، فقد وزن)', 1, 'Cauda equina is an emergency.|متلازمة الذيل الفرسي طوارئ.'],
      ['Inspect posture, curves, gait (heel / toe walking)|عاين الوقفة والانحناءات والمشية (المشي على الكعب والأصابع)', 0, ''],
      ['Palpate the spinous processes, paraspinal muscles and sacroiliac joints|حس الأشواك والعضلات جنب الفقرات والمفصل العجزي الحرقفي', 0, '', ['^Lumbar vertebra', '^Sacrum']],
      ['Movements: flexion, extension, side flexion, rotation and note pain|الحركات: ثني وبسط وميل جانبي ودوران مع ملاحظة الألم', 1, ''],
      ['Straight leg raise (and crossed SLR)|رفع الرجل المفرودة (والمتقاطع)', 1, 'Positive between 30° and 70° suggests L5/S1 root irritation.|إيجابي بين 30 و70 درجة بيدل على تهيج جذر L5/S1.'],
      ['Myotomes L2–S1: hip flexion, knee extension, ankle dorsiflexion, big-toe extension, plantarflexion|القوة العضلية L2–S1: ثني الورك وفرد الركبة وبسط الكاحل وبسط الإبهام وثني القدم لتحت', 1, '', ['^Extensor hallucis longus', '^Sciatic nerve']],
      ['Reflexes: knee (L3–4) and ankle (S1)|المنعكسات: الركبة (L3–4) والكاحل (S1)', 1, ''],
      ['Dermatomes: light touch of L2–S1 and perianal sensation if indicated|الإحساس بالجذور L2–S1 وحول الشرج لو لزم', 1, ''],
      ['Examine the hips and peripheral pulses; thank the patient and summarise|افحص الورك والنبض الطرفي واشكر المريض ولخّص', 0, '']],
    bad: ['Skip the red-flag questions|اتخطى أسئلة علامات الخطر', 'Perform SLR with the knee flexed|اعمل رفع الرجل والركبة مثنية', 'Test reflexes only at the knee|اختبر منعكس الركبة بس', 'Ignore the perianal sensation in suspected cauda equina|اتجاهل إحساس حول الشرج مع اشتباه الذيل الفرسي'] },
  { id: 'gonio', f: ['pt'], t: 'Goniometry – elbow flexion|قياس مدى الحركة بالجونيوميتر – ثني الكوع', sc: 'Measure active elbow flexion range with a universal goniometer.|قيس مدى ثني الكوع النشط بالجونيوميتر.',
    st: [['Explain the procedure and get consent; expose the arm|اشرح واحصل على الموافقة واكشف الدراع', 1, ''],
      ['Position the patient supine with the arm by the side, shoulder in neutral and forearm supinated|وضّع المريض نايم على ضهره والدراع جنبه والكتف محايد والساعد مبطوح لفوق', 1, ''],
      ['Stabilise the humerus; palpate and mark the landmarks: acromion, lateral epicondyle, radial styloid process|ثبّت العضد وحس وعلّم المعالم: الأخرم واللقمة الوحشية والناتئ الإبري للكعبرة', 1, 'Landmarks decide the accuracy of the measurement.|المعالم هي اللي بتحدد دقة القياس.', ['^Humerus', '^Radius', '^Scapula']],
      ['Align the goniometer axis over the lateral epicondyle|ظبط محور الجونيوميتر فوق اللقمة الوحشية', 1, ''],
      ['Align the stationary arm with the humerus (towards the acromion) and the moving arm with the radius (towards the radial styloid)|ظبط الذراع الثابت مع العضد (ناحية الأخرم) والمتحرك مع الكعبرة (ناحية الناتئ الإبري)', 1, ''],
      ['Record the starting position (0°)|سجّل وضع البداية (0 درجة)', 0, ''],
      ['Ask the patient to flex the elbow actively as far as possible without moving the shoulder|اطلب من المريض يثني الكوع نشطا لأقصى حد من غير ما يحرك الكتف', 0, ''],
      ['Re-align and read the end-range angle (normal about 0–140°/150°)|ظبط تاني واقرأ الزاوية النهائية (الطبيعي حوالي 0–140/150 درجة)', 1, ''],
      ['Record the value, compare with the other side, note the end-feel and pain|سجّل القيمة وقارن بالناحية التانية ولاحظ إحساس نهاية الحركة والألم', 0, '']],
    bad: ['Place the axis over the olecranon tip|حط المحور فوق قمة المرفق', 'Allow shoulder movement during the measurement|اسمح بحركة الكتف وقت القياس', 'Measure only once on the painful side|قيس مرة واحدة في الناحية المؤلمة بس', 'Skip marking the landmarks|اتخطى تعليم المعالم'] },
];
(() => {
  if (window.__osceLoaded) return; window.__osceLoaded = 1;
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  const pair = (s) => { const i = s.indexOf('|'); return [s.slice(0, i), s.slice(i + 1)]; };
  const tt = (s) => { const p = pair(s); return T(p[0], p[1]); };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  Object.assign(STR, {
    osce: { en: 'OSCE checklists', ar: 'قوائم OSCE' },
    osceSub: { en: 'Procedure steps in order · test yourself · see the anatomy in 3D', ar: 'خطوات الإجراء بالترتيب · اختبر نفسك · وشوف التشريح على المجسم' },
  });
  const D = () => { const d = Store.d; return d.osce || (d.osce = {}); };
  const fac = () => (A.acct && A.acct.fac) || '';
  const list = () => { const f = fac(), L = OS.filter((p) => p.f.includes(f)); return L.length ? L : OS; };
  let cur = null, M = null;   /* cur = procedure, M = assess state {k, picks:[], ans:null, opts} */
  const mkOpts = (p, k) => {
    const later = p.st.slice(k + 3).map((s) => s[0]), bad = shuffle(p.bad.slice());
    const wrong = shuffle([...bad.slice(0, 2), ...(later.length ? shuffle(later).slice(0, 1) : [bad[2]])].filter(Boolean));
    while (wrong.length < 3 && bad.length > wrong.length) wrong.push(bad[wrong.length]);
    return shuffle([{ s: p.st[k][0], ok: true }, ...wrong.slice(0, 3).map((s) => ({ s, ok: false }))]);
  };
  const listHtml = () => {
    const d = D();
    return `<h2>📋 ${T('OSCE checklists', 'قوائم OSCE')}</h2><p class="lead">${T('Learn each procedure step by step, then test yourself. ⭐ marks the critical steps examiners fail you for.', 'اتعلم كل إجراء خطوة بخطوة وبعدين اختبر نفسك. ⭐ معناها خطوة حرجة بتتحاسب عليها في الامتحان.')}</p>` +
      list().map((p) => { const r = d[p.id]; return `<button class="btn wide" style="display:flex;justify-content:space-between;margin:6px 0;text-align:start" data-act="oscopen" data-id="${p.id}"><span>${esc(tt(p.t))}</span><small>${r ? r.best + '%' : p.st.length + ' ' + T('steps', 'خطوة')}</small></button>`; }).join('') +
      `<p class="tiny">${T('Draft content – a clinician / educator must review before relying on it.', 'محتوى مسودة – لازم دكتور أو مدرّس يراجعه قبل الاعتماد عليه.')}</p>`;
  };
  const learnHtml = () => `<h2>📋 ${esc(tt(cur.t))}</h2><p class="lead">${esc(tt(cur.sc))}</p><ol style="padding-inline-start:22px;margin:6px 0">` +
    cur.st.map((s, i) => `<li style="margin:9px 0;line-height:1.7">${s[1] ? '⭐ ' : ''}${esc(tt(s[0]))}${s[2] ? `<div style="font-size:12px;opacity:.75">💡 ${esc(tt(s[2]))}</div>` : ''}${s[3] ? ` <button class="btn" style="min-height:28px;padding:2px 10px;font-size:12px" data-act="oscshow" data-i="${i}">🧍 ${T('3D', 'مجسم')}</button>` : ''}</li>`).join('') +
    `</ol><div class="row" style="flex-wrap:wrap"><button class="btn primary" data-act="oscstart">🎯 ${T('Test me', 'قيّمني')}</button><button class="btn" data-act="osclist">${T('Back', 'رجوع')}</button></div>`;
  const assessHtml = () => {
    const k = M.k, p = cur, n = p.st.length;
    if (k >= n) return resultHtml();
    const done = p.st.slice(0, k).map((s, i) => `<div style="font-size:12px;opacity:.7">✔ ${i + 1}. ${esc(tt(s[0]).slice(0, 80))}</div>`).join('');
    const opts = M.opts.map((o, i) => { const st = M.ans === null ? '' : o.ok ? 'border-color:#3fd67a;background:rgba(63,214,122,.15)' : M.ans === i ? 'border-color:#ff6b6b;background:rgba(255,107,107,.15)' : ''; return `<button class="btn" style="display:block;width:100%;margin:5px 0;text-align:start;${st}" data-act="oscans" data-i="${i}" ${M.ans === null ? '' : 'disabled'}>${esc(tt(o.s))}</button>`; }).join('');
    const s = p.st[k];
    const fb = M.ans === null ? '' : `<div class="pjcurve" style="margin-top:8px"><b>${M.opts[M.ans].ok ? T('Correct!', 'تمام!') : T('Not quite.', 'مش بالظبط.')}</b>${s[1] ? ' ⭐' : ''}<p style="font-size:13px;line-height:1.7;margin:4px 0">${esc(tt(s[0]))}</p>${s[2] ? `<p style="font-size:12px;opacity:.8">💡 ${esc(tt(s[2]))}</p>` : ''}<div class="row">${s[3] ? `<button class="btn" data-act="oscshow" data-i="${k}" data-from="a">🧍 ${T('Show on the 3D model', 'اعرضه على المجسم')}</button>` : ''}<button class="btn primary" data-act="oscnext">${k + 1 >= n ? T('Finish', 'إنهاء') : T('Next step', 'الخطوة اللي بعدها')}</button></div></div>`;
    return `<h2>🎯 ${esc(tt(p.t))}</h2><p class="tiny">${esc(tt(p.sc))}</p><div class="pjcurve"><small>${T('Step', 'خطوة')} ${k + 1} / ${n}</small>${done ? `<div style="margin:6px 0">${done}</div>` : ''}<p style="margin:8px 0;font-weight:700">${T('What is the NEXT step?', 'إيه الخطوة اللي بعدها؟')}</p>${opts}</div>${fb}`;
  };
  const resultHtml = () => {
    const p = cur, n = p.st.length, ok = M.picks.filter((x) => x).length, pc = Math.round(ok / n * 100), crit = p.st.map((s, i) => [s, i]).filter(([s, i]) => s[1] && !M.picks[i]);
    return `<h2>🎯 ${esc(tt(p.t))}</h2><div class="pjcurve" style="text-align:center;padding:16px 12px"><div dir="ltr" style="font-size:34px;font-weight:800">${ok} / ${n}</div><p>${crit.length ? '⚠️ ' + T('You missed critical steps:', 'فاتتك خطوات حرجة:') : pc >= 80 ? T('Excellent – you know the sequence!', 'ممتاز – حافظ الترتيب!') : T('Good – review the steps.', 'كويس – راجع الخطوات.')}</p></div>` +
      (crit.length ? '<ol style="padding-inline-start:22px">' + crit.map(([s, i]) => `<li style="margin:6px 0;font-size:13px">⭐ ${i + 1}. ${esc(tt(s[0]))}</li>`).join('') + '</ol>' : '') +
      `<div class="row" style="flex-wrap:wrap"><button class="btn primary" data-act="oscstart">🔁 ${T('Try again', 'حاول تاني')}</button><button class="btn" data-act="oscopen" data-id="${p.id}">${T('See the steps', 'شوف الخطوات')}</button><button class="btn" data-act="osclist">${T('All procedures', 'كل الإجراءات')}</button></div>`;
  };
  let view = 'list';
  const html = () => (view === 'learn' ? learnHtml() : view === 'assess' ? assessHtml() : listHtml());
  const go = (v) => { view = v; if (!$('modal') || $('modal').hidden) A.modal(html); else A.rerenderModal(); };
  A.acts.osclist = () => go('list');
  A.acts.oscopen = (el) => { cur = OS.find((p) => p.id === el.dataset.id); go('learn'); };
  A.acts.oscstart = () => { M = { k: 0, picks: [], ans: null, opts: mkOpts(cur, 0) }; go('assess'); };
  A.acts.oscans = (el) => {
    if (!M || M.ans !== null) return; M.ans = +el.dataset.i; M.picks[M.k] = M.opts[M.ans].ok; A.rerenderModal();
  };
  A.acts.oscnext = () => {
    if (!M) return; M.k++; M.ans = null;
    if (M.k >= cur.st.length) {
      const n = cur.st.length, ok = M.picks.filter((x) => x).length, pc = Math.round(ok / n * 100), r = D()[cur.id] || { best: 0, runs: 0 };
      r.best = Math.max(r.best, pc); r.runs++; D()[cur.id] = r; Store.save(); try { if (A.logAct) A.logAct(n, ok); if (A.checkBadges) A.checkBadges(); } catch (e) { /* ignore */ }
    } else M.opts = mkOpts(cur, M.k);
    A.rerenderModal();
  };
  A.acts.oscshow = async (el) => {
    const s = cur.st[+el.dataset.i]; if (!s || !s[3] || !A.focusParts) return; const back = view;
    A.closeModal(); const ok = await A.focusParts(s[3], 'r'); if (!ok) { A.modal(html); return; }
    const old = $('hntbar'); if (old) old.remove();
    const b = document.createElement('div'); b.id = 'hntbar'; b.innerHTML = `<div class="hq">${esc(tt(s[0]).slice(0, 110))}</div><div class="hr"><button class="p" data-act="oscback">⬅ ${T('Back to the checklist', 'رجوع للقائمة')}</button></div>`; $('app').appendChild(b); view = back;
  };
  A.acts.oscback = () => { const b = $('hntbar'); if (b) b.remove(); S.hl = null; S.focus = null; try { A.apply(); } catch (e) { /* ignore */ } A.modal(html); };
  const open = () => { view = 'list'; cur = null; M = null; A.modal(html); };
  waitFor(() => A.hubExtra && A.modal && A.focusParts, () => { A.hubExtra.osce = open; });
})();
