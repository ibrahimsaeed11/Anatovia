/* clinmed.js — "Clinical anatomy cases": a vignette (sign / symptom) → which structure is injured, with a "show on the 3D model" button.
   DRAFT medical content — must be reviewed by a physician. Educational only. */
'use strict';
window.__clinmedLoaded = true;
/* each: [vignette en|ar, [4 options en|ar — the FIRST is correct], explanation en|ar, show regexes (matched against structure names), side] */
const CL = [
['A man has wrist drop and loss of finger extension after a mid-shaft humeral fracture. Which nerve is injured?|راجل عنده سقوط في رسغ اليد وفقد بسط الأصابع بعد كسر في منتصف عظمة العضد. أنهي عصب اتأذى؟',
 ['Radial nerve|العصب الكعبري','Median nerve|العصب الأوسط','Ulnar nerve|العصب الزندي','Axillary nerve|العصب الإبطي'],
 'The radial nerve runs in the radial (spiral) groove on the posterior humerus and supplies all the extensors of the wrist and fingers. "Saturday-night palsy" (pressure in the arm) gives the same picture.|العصب الكعبري بيلف في الميزاب الحلزوني ورا العضد وبيغذي كل باسطات الرسغ والأصابع. "شلل ليلة السبت" (ضغط على الدراع) بيدّي نفس الصورة.',
 ['^Radial nerve$','^Humerus'],null],
['After axillary lymph-node dissection a woman has a "winged" scapula when she pushes against a wall. Which nerve?|بعد استئصال العقد الليمفاوية بالإبط ظهر عند ست لوح كتف "بارز زي الجناح" لما بتدفع حيطة. أنهي عصب؟',
 ['Long thoracic nerve|العصب الصدري الطويل','Thoracodorsal nerve|العصب الصدري الظهري','Dorsal scapular nerve|العصب الكتفي الظهري','Spinal accessory nerve|العصب الشوكي الإضافي'],
 'The long thoracic nerve (C5–C7) runs on the surface of serratus anterior, which holds the scapula against the chest wall. It is injured in mastectomy / axillary surgery.|العصب الصدري الطويل (C5–C7) بيمشي على سطح العضلة المسننة الأمامية اللي بتثبّت لوح الكتف على القفص الصدري، وبيتأذى في جراحات الثدي والإبط.',
 ['^Long thoracic nerve$','^Serratus anterior$'],null],
['A footballer is kicked on the lateral side of the knee and cannot dorsiflex the foot (foot drop) with numbness of the dorsum of the foot. Which nerve?|لاعب كورة اتضرب على الناحية الجانبية للركبة ومبقاش يقدر يرفع القدم لفوق (قدم متدلية) مع تنميل ظهر القدم. أنهي عصب؟',
 ['Common fibular (peroneal) nerve|العصب الشظوي المشترك','Tibial nerve|العصب الظنبوبي','Femoral nerve|العصب الفخذي','Sural nerve|العصب الربلي'],
 'The common fibular nerve winds around the neck of the fibula, where it is superficial and easily injured. It supplies the dorsiflexors and evertors.|العصب الشظوي المشترك بيلف حوالين رقبة الشظية وهو سطحي هناك فبيتأذى بسهولة، وبيغذي رافعات القدم ومُقلِّباتها للخارج.',
 ['^Common fibular','^Fibula$'],null],
['A woman has night-time tingling in the thumb, index and middle fingers and weakness of thumb opposition. Which nerve is compressed, and where?|ست عندها تنميل بالليل في الإبهام والسبابة والوسطى وضعف في مقابلة الإبهام. أنهي عصب متضغط وفين؟',
 ['Median nerve in the carpal tunnel|العصب الأوسط في النفق الرسغي','Ulnar nerve in Guyon canal|العصب الزندي في قناة جيّون','Radial nerve in the spiral groove|العصب الكعبري في الميزاب الحلزوني','Median nerve at the elbow (pronator teres)|العصب الأوسط عند الكوع'],
 'Carpal tunnel syndrome: the median nerve is compressed under the flexor retinaculum. The thenar muscles waste; sensation of the lateral 3½ digits is lost but the thenar eminence skin is spared (palmar cutaneous branch arises proximally).|متلازمة النفق الرسغي: العصب الأوسط بيتضغط تحت الرباط الثاني. عضلات الإبهام بتضمر وبيروح الإحساس في 3 أصابع ونص ناحية الإبهام، لكن جلد بروز الإبهام سليم لأن الفرع الراحي بيطلع قبل النفق.',
 ['^Median nerve$','^Flexor retinaculum|Flexor retinaculum'],null],
['After a fracture of the medial epicondyle the patient develops a "claw hand" with weak finger adduction and numbness of the little finger. Which nerve?|بعد كسر اللقيمة الإنسية للعضد ظهرت "يد مخلبية" مع ضعف ضم الأصابع وتنميل الخنصر. أنهي عصب؟',
 ['Ulnar nerve|العصب الزندي','Median nerve|العصب الأوسط','Radial nerve|العصب الكعبري','Musculocutaneous nerve|العصب العضلي الجلدي'],
 'The ulnar nerve passes behind the medial epicondyle ("funny bone"). Loss of the medial lumbricals gives the claw; the interossei no longer adduct/abduct the fingers (Froment sign).|العصب الزندي بيعدّي ورا اللقيمة الإنسية. ضعف الديدانيات الإنسية بيعمل المخلب، والعضلات بين العظمية مبقتش تضم وتفرد الأصابع (علامة فرومنت).',
 ['^Ulnar nerve$','^Humerus$'],null],
['A newborn after a difficult delivery holds the arm adducted, internally rotated and extended with the forearm pronated ("waiter\'s tip"). Which part of the brachial plexus?|مولود بعد ولادة عسيرة ماسك دراعه مضموم ودايِر لجوه ومفرود والساعد مكبوب ("وضع جرسون البقشيش"). أنهي جزء في الضفيرة العضدية؟',
 ['Upper trunk (C5–C6) – Erb palsy|الجذع العلوي (C5–C6) – شلل إرب','Lower trunk (C8–T1) – Klumpke|الجذع السفلي (C8–T1) – كلومبكي','Posterior cord|الحبل الخلفي','Medial cord|الحبل الإنسي'],
 'Erb–Duchenne palsy: excessive neck–shoulder separation injures C5–C6. Deltoid, supraspinatus, infraspinatus, biceps and brachialis are weak. Klumpke (C8–T1) affects the small hand muscles and may give Horner syndrome.|شلل إرب: ابتعاد الرقبة عن الكتف بقوة بيأذي C5–C6، فبتضعف الدالية وفوق وتحت الشوكة والعضلة ذات الرأسين والعضدية. شلل كلومبكي (C8–T1) بيأثر على عضلات اليد الصغيرة وممكن يظهر معاه متلازمة هورنر.',
 ['^Brachial plexus – superior trunk','^Brachial plexus – roots'],null],
['A young man dislocates his shoulder anteriorly and has weak abduction past 15° and numbness over the "regimental-badge" area. Which nerve?|شاب كتفه خلع للأمام وعنده ضعف في فتح الدراع بعد 15 درجة وتنميل في منطقة "الشارة" على الكتف. أنهي عصب؟',
 ['Axillary nerve|العصب الإبطي','Suprascapular nerve|العصب فوق الكتف','Musculocutaneous nerve|العصب العضلي الجلدي','Thoracodorsal nerve|العصب الصدري الظهري'],
 'The axillary nerve (C5–C6) wraps the surgical neck of the humerus with the posterior circumflex humeral artery; it supplies deltoid and teres minor and the skin over the lateral deltoid.|العصب الإبطي (C5–C6) بيلف حوالين الرقبة الجراحية للعضد مع الشريان المحيط الخلفي، وبيغذي الدالية والمدورة الصغرى وجلد الجزء الجانبي من الكتف.',
 ['^Axillary nerve$','^Deltoid \\('],null],
['A patient cannot start abduction of the arm but can continue it if the arm is passively lifted ~15° (positive drop-arm). Which muscle is torn?|مريض مش قادر يبدأ فتح الدراع لكن يكمل لو الدراع اترفع 15 درجة بإيد حد (اختبار سقوط الدراع إيجابي). أنهي عضلة اتقطعت؟',
 ['Supraspinatus|فوق الشوكة','Infraspinatus|تحت الشوكة','Subscapularis|تحت لوح الكتف','Teres minor|المدورة الصغرى'],
 'Supraspinatus starts abduction (first ~15°) and is the most commonly torn rotator-cuff muscle because it is pinched under the acromion (impingement).|فوق الشوكة بتبدأ فتح الدراع (أول 15 درجة تقريبا) وهي أكتر عضلة بتتقطع في الكفة المدورة لأنها بتتضغط تحت الأخرم.',
 ['^Supraspinatus$','^Scapula'],null],
['A woman walks with the pelvis dropping on the opposite side when she stands on one leg (positive Trendelenburg) after a gluteal injection. Which nerve?|ست مشيتها الحوض بينزل ناحية الجنب التاني لما تقف على رجل واحدة (علامة ترندلنبرج إيجابية) بعد حقنة في الإلية. أنهي عصب؟',
 ['Superior gluteal nerve|العصب الإلوي العلوي','Inferior gluteal nerve|العصب الإلوي السفلي','Sciatic nerve|العصب الوركي','Obturator nerve|العصب السدادي'],
 'The superior gluteal nerve supplies gluteus medius/minimus and tensor fasciae latae, which stabilise the pelvis in single-leg stance. Safe injection site: upper outer quadrant of the buttock.|العصب الإلوي العلوي بيغذي الإلوية المتوسطة والصغرى والموترة للفافة العريضة اللي بتثبّت الحوض في الوقوف على رجل. مكان الحقن الآمن: الربع العلوي الخارجي من الإلية.',
 ['^Superior gluteal nerve$','^Gluteus medius$'],null],
['After a gluteal injection into the lower inner quadrant, a patient has foot drop and loss of hamstring function. Which nerve was injured?|بعد حقنة في الربع السفلي الداخلي للإلية ظهرت قدم متدلية وضعف في العضلات الخلفية للفخذ. أنهي عصب اتأذى؟',
 ['Sciatic nerve|العصب الوركي','Femoral nerve|العصب الفخذي','Obturator nerve|العصب السدادي','Superior gluteal nerve|العصب الإلوي العلوي'],
 'The sciatic nerve leaves the pelvis through the greater sciatic foramen below piriformis and runs down the posterior thigh, so it lies in the lower-medial buttock. Hamstrings and everything below the knee are affected.|العصب الوركي بيخرج من الحوض عبر الثقبة الوركية الكبيرة تحت العضلة الكمثرية وينزل في خلف الفخذ، فهو في الإلية السفلية الداخلية. بيتأثر الخلفيات وكل اللي تحت الركبة.',
 ['^Sciatic nerve$','^Piriformis$'],null],
['A patient cannot extend the knee and has lost the patellar reflex with numbness on the anterior thigh. Which nerve?|مريض مش قادر يفرد الركبة وراح عنده منعكس الرضفة مع تنميل في مقدمة الفخذ. أنهي عصب؟',
 ['Femoral nerve (L2–L4)|العصب الفخذي (L2–L4)','Obturator nerve|العصب السدادي','Sciatic nerve|العصب الوركي','Tibial nerve|العصب الظنبوبي'],
 'The femoral nerve supplies quadriceps (knee extension) and sartorius, and the anterior thigh skin; the patellar reflex tests L2–L4.|العصب الفخذي بيغذي الرباعية (فرد الركبة) والخياطية وجلد مقدمة الفخذ، ومنعكس الرضفة بيفحص L2–L4.',
 ['^Femoral nerve$','^Quadriceps|Rectus femoris'],null],
['A pregnant, overweight woman has burning pain and numbness over the anterolateral thigh with no weakness. Which nerve is entrapped?|ست حامل وزنها زيادة عندها حرقان وتنميل في الناحية الأمامية الجانبية للفخذ من غير ضعف. أنهي عصب متضغط؟',
 ['Lateral femoral cutaneous nerve|العصب الجلدي الفخذي الجانبي','Femoral nerve|العصب الفخذي','Obturator nerve|العصب السدادي','Ilioinguinal nerve|العصب الحرقفي الأربي'],
 'Meralgia paraesthetica: a purely sensory nerve that passes under/through the inguinal ligament near the ASIS.|Meralgia paraesthetica: عصب حسي بحت بيعدّي تحت أو خلال الرباط الإربي قرب الشوكة الحرقفية الأمامية العليا.',
 ['^Lateral femoral cutaneous','^Inguinal ligament'],null],
['After thyroid surgery a patient is hoarse and has a weak voice. Which nerve is most likely injured, and which artery is it related to?|بعد جراحة الغدة الدرقية المريض صوته مبحوح وضعيف. أنهي عصب غالبا اتأذى ومرتبط بأنهي شريان؟',
 ['Recurrent laryngeal nerve – inferior thyroid artery|العصب الحنجري الراجع – الشريان الدرقي السفلي','External laryngeal nerve – superior thyroid artery|العصب الحنجري الخارجي – الشريان الدرقي العلوي','Glossopharyngeal nerve – lingual artery|العصب اللساني البلعومي – الشريان اللساني','Hypoglossal nerve – facial artery|العصب تحت اللسان – الشريان الوجهي'],
 'The recurrent laryngeal nerve (a branch of the vagus) ascends in the tracheo-oesophageal groove and is closely related to the inferior thyroid artery. It supplies all intrinsic laryngeal muscles except cricothyroid (external laryngeal nerve, which accompanies the superior thyroid artery). Ligate the inferior thyroid artery away from the gland.|العصب الحنجري الراجع (فرع من المبهم) بيطلع في الميزاب بين القصبة والمريء وقريب من الشريان الدرقي السفلي، وبيغذي كل عضلات الحنجرة الداخلية ماعدا الحلقية الدرقية (العصب الحنجري الخارجي مع الشريان الدرقي العلوي).',
 ['^Thyroid gland$','^Inferior thyroid artery','^Vagus nerve|^Larynx$'],null],
['A teenager develops periumbilical pain that moves to the right iliac fossa over 12 hours, with tenderness at McBurney point. Which organ?|مراهق عنده ألم حوالين السرة انتقل للحفرة الحرقفية اليمنى بعد 12 ساعة مع ألم عند نقطة ماكبرني. أنهي عضو؟',
 ['Vermiform appendix|الزائدة الدودية','Gallbladder|المرارة','Right ureter|الحالب الأيمن','Sigmoid colon|القولون السيني'],
 'Early visceral pain from the midgut (appendix) is referred to the periumbilical region (T10); once the parietal peritoneum is irritated the pain localises to the right iliac fossa (McBurney point: 1/3 from the ASIS to the umbilicus).|الألم الحشوي المبكر من الأمعاء المتوسطة (الزائدة) بيتحس حوالين السرة (T10)، ولما الصفاق الجداري يتهيج الألم بيتحدد في الحفرة الحرقفية اليمنى (نقطة ماكبرني: ثلث المسافة من الشوكة الحرقفية للسرة).',
 ['^Vermiform appendix$','^Ascending colon$'],null],
['A patient has right upper-quadrant pain that radiates to the tip of the right shoulder. Why?|مريض عنده ألم في الربع العلوي الأيمن بيمتد لطرف الكتف اليمين. ليه؟',
 ['Diaphragmatic irritation – phrenic nerve (C3–C5)|تهيج الحجاب الحاجز – العصب الحجابي (C3–C5)','Vagus nerve referral|ألم محال من المبهم','Intercostal nerve compression|ضغط على الأعصاب الوربية','Pressure on the brachial plexus|ضغط على الضفيرة العضدية'],
 'Gallbladder inflammation irritates the diaphragm; the phrenic nerve (C3–C5) shares spinal levels with the skin over the shoulder tip (supraclavicular nerves, C3–C4), so the pain is referred there (Kehr sign).|التهاب المرارة بيهيج الحجاب الحاجز، والعصب الحجابي (C3–C5) بيشارك نفس المستويات الشوكية مع جلد طرف الكتف (C3–C4)، فبيتحس الألم هناك (علامة كير).',
 ['^Gallbladder$','^Diaphragm$','^Liver$'],'r'],
['A patient with a temporal-bone fracture lucid interval then rapidly loses consciousness. Which vessel is torn?|مريض بكسر في العظم الصدغي كان واعي فترة وبعدين فقد الوعي بسرعة. أنهي وعاء اتقطع؟',
 ['Middle meningeal artery (epidural haematoma)|الشريان السحائي المتوسط (ورم دموي خارج الجافية)','Bridging veins (subdural haematoma)|الأوردة الجسرية (ورم دموي تحت الجافية)','Anterior cerebral artery|الشريان المخي الأمامي','Superior sagittal sinus|الجيب السهمي العلوي'],
 'The middle meningeal artery (from the maxillary artery) enters via the foramen spinosum and runs under the pterion, the thinnest part of the lateral skull. Bleeding strips the dura from the bone: biconvex (lens-shaped) clot.|الشريان السحائي المتوسط (من الفكي) بيدخل من الثقب الشوكي وبيعدّي تحت النقطة الجناحية، أرق جزء في الجمجمة من الجنب. النزيف بيفصل الأم الجافية عن العظم وشكل التجلط عدسي محدب.',
 ['^Middle meningeal artery$','^Temporal bone$'],null],
['A patient has a ptosis, miosis and anhidrosis on one side after a lung-apex (Pancoast) tumour. Which structure is compressed?|مريض عنده تدلي جفن وانقباض في الحدقة وعدم تعرق في جهة واحدة بعد ورم في قمة الرئة (بانكوست). أنهي تركيب اتضغط؟',
 ['Sympathetic chain / stellate ganglion|السلسلة السمبثاوية / العقدة النجمية','Phrenic nerve|العصب الحجابي','Recurrent laryngeal nerve|العصب الحنجري الراجع','Vagus nerve|العصب المبهم'],
 'Horner syndrome = interruption of the cervical sympathetic pathway (ptosis, miosis, anhidrosis, enophthalmos). The apical tumour invades the stellate ganglion and may also affect the lower trunk of the brachial plexus (C8–T1).|متلازمة هورنر = قطع المسار السمبثاوي العنقي (تدلي جفن، انقباض حدقة، عدم تعرق، غور العين). ورم القمة بيغزو العقدة النجمية وممكن يأثر على الجذع السفلي للضفيرة (C8–T1).',
 ['^Sympathetic trunk','^Brachial plexus – inferior trunk','^Right lung – |^Left lung – '],null],
['A man cannot close the eye or wrinkle the forehead on one side, and the mouth droops on the same side. Which nerve, and is the lesion upper or lower motor neuron?|راجل مش قادر يقفل عينه ولا يكرمش جبهته في جهة واحدة والفم نازل في نفس الجهة. أنهي عصب ونوع الإصابة؟',
 ['Facial nerve – lower motor neuron (Bell palsy)|العصب الوجهي – إصابة عصبون حركي سفلي (شلل بيل)','Facial nerve – upper motor neuron (stroke)|العصب الوجهي – إصابة عصبون حركي علوي (سكتة)','Trigeminal nerve – lower motor neuron|العصب ثلاثي التوائم – عصبون سفلي','Hypoglossal nerve|العصب تحت اللسان'],
 'The upper face receives bilateral cortical input, so a stroke (UMN lesion) spares the forehead. When the whole half of the face is paralysed, the facial nerve itself (VII) is injured (LMN), e.g. Bell palsy.|الوجه العلوي بيجيله تغذية من القشرة الدماغية للجهتين، فالسكتة (إصابة علوية) بتسيب الجبهة سليمة. لو نص الوجه كله مشلول فالعصب الوجهي نفسه (VII) هو المصاب (عصبون سفلي) زي شلل بيل.',
 ['^Facial nerve'],null],
['After a carotid endarterectomy the tongue deviates to the right on protrusion. Which nerve and on which side is the lesion?|بعد عملية في الشريان السباتي اللسان بيميل لليمين لما يطلعه. أنهي عصب وفي أنهي جهة الإصابة؟',
 ['Right hypoglossal nerve|العصب تحت اللسان الأيمن','Left hypoglossal nerve|العصب تحت اللسان الأيسر','Right glossopharyngeal nerve|العصب اللساني البلعومي الأيمن','Left lingual nerve|العصب اللساني الأيسر'],
 'The tongue deviates TOWARD the side of a hypoglossal lesion, because the intact genioglossus on the other side pushes the tongue across. The nerve crosses the carotid arteries in the neck.|اللسان بيميل ناحية جهة الإصابة في العصب تحت اللسان لأن العضلة الذقنية اللسانية السليمة في الجهة التانية بتزقه. والعصب بيعدّي فوق الشرايين السباتية في الرقبة.',
 ['^Hypoglossal nerve'],'r'],
['After a head injury a patient reports loss of smell and clear fluid dripping from the nose. Which bone is fractured?|بعد إصابة في الراس مريض فقد حاسة الشم وبينزل سائل رائق من الأنف. أنهي عظمة مكسورة؟',
 ['Cribriform plate of the ethmoid|الصفيحة الغربالية للعظم الغربالي','Petrous part of the temporal bone|الجزء الصخري للعظم الصدغي','Greater wing of the sphenoid|الجناح الأكبر للوتدي','Occipital bone|العظم القذالي'],
 'The olfactory nerve fibres pass through the cribriform plate; a fracture tears them (anosmia) and the meninges (CSF rhinorrhoea), a route for meningitis.|ألياف العصب الشمي بتعدّي من الصفيحة الغربالية، فالكسر بيقطعها (فقدان الشم) وبيقطع السحايا (تسريب سائل مخي شوكي من الأنف) وده طريق لالتهاب السحايا.',
 ['^Ethmoid bone$','^Olfactory nerve'],null],
['A patient cannot abduct the right eye and has horizontal double vision (medial squint) at rest. Which nerve and muscle?|مريض مش قادر يحرك العين اليمين للخارج وعنده ازدواج رؤية أفقي (حول داخلي) وهو ساكت. أنهي عصب وعضلة؟',
 ['Abducens nerve (VI) – lateral rectus|العصب المبعد (VI) – المستقيمة الوحشية','Oculomotor nerve (III) – medial rectus|العصب المحرك للعين (III) – المستقيمة الإنسية','Trochlear nerve (IV) – superior oblique|العصب البكري (IV) – المائلة العلوية','Optic nerve (II)|العصب البصري (II)'],
 'CN VI has the longest intracranial course so it is injured easily by raised intracranial pressure. Rule: LR6 SO4 all the rest 3 (lateral rectus – VI, superior oblique – IV, others – III).|العصب القحفي السادس أطول مسار داخل الجمجمة فبيتأذى بسهولة مع زيادة الضغط. قاعدة: LR6 SO4 والباقي 3.',
 ['^Abducens nerve'],'r'],
['A child inhales a peanut while playing. In which main bronchus is it most likely to lodge, and why?|طفل شفط فول سوداني وهو بيلعب. غالبا هيستقر في أنهي شعبة رئيسية وليه؟',
 ['Right – wider, shorter and more vertical|اليمنى – أوسع وأقصر وأكتر عمودية','Left – wider and shorter|اليسرى – أوسع وأقصر','Left – more vertical|اليسرى – أكتر عمودية','Both equally|الاتنين بالتساوي'],
 'The right main bronchus is wider, shorter and runs more vertically than the left, so aspirated objects usually enter it (typically the right lower lobe when upright or the posterior segment of the right upper lobe when supine).|الشعبة الرئيسية اليمنى أوسع وأقصر وأكتر عمودية من اليسرى، فالأجسام المستنشقة بتدخلها غالبا (الفص السفلي الأيمن في الوقوف، أو القطعة الخلفية للفص العلوي الأيمن وهو نايم).',
 ['^Right main bronchus|^Trachea$','^Left main bronchus'],null],
['A hiker falls on an outstretched hand and has tenderness in the anatomical snuffbox. Which bone is likely fractured, and what is the main complication?|شخص وقع على إيده المفرودة وعنده ألم في الحفرة التشريحية (التبغ). أنهي عظمة غالبا مكسورة وإيه أهم مضاعفاتها؟',
 ['Scaphoid – avascular necrosis|الزورقية – نخر لاوعائي','Lunate – carpal tunnel syndrome|الهلالية – متلازمة النفق الرسغي','Hamate – ulnar nerve injury|الكلابية – إصابة العصب الزندي','Radius – wrist drop|الكعبرة – سقوط الرسغ'],
 'The scaphoid is the most commonly fractured carpal bone; its blood supply (radial artery branches) enters distally and runs retrograde, so a waist/proximal-pole fracture risks avascular necrosis and non-union. The snuffbox is bounded by the tendons of abductor pollicis longus/extensor pollicis brevis and extensor pollicis longus.|الزورقية أكتر عظمة رسغية بتتكسر، ودمها (من فروع الشريان الكعبري) بيدخل من الطرف البعيد ويرجع ناحية القريب، فكسر الخصر أو القطب القريب بيعرضها للنخر وعدم الالتئام. الحفرة التشريحية حدودها وتر المبعدة الطويلة والباسطة القصيرة للإبهام، والباسطة الطويلة.',
 ['^Scaphoid$','^Radial artery'],null],
['A soccer player twists his knee: the tibia shifts forward in the anterior drawer test. Which ligament is torn?|لاعب كورة لف ركبته وعظمة القصبة بتتحرك لقدام في اختبار الدرج الأمامي. أنهي رباط اتقطع؟',
 ['Anterior cruciate ligament|الرباط الصليبي الأمامي','Posterior cruciate ligament|الرباط الصليبي الخلفي','Medial collateral ligament|الرباط الجانبي الإنسي','Lateral collateral ligament|الرباط الجانبي الوحشي'],
 'ACL prevents anterior translation of the tibia on the femur. The "unhappy triad" (O\'Donoghue) is ACL + medial collateral ligament + medial meniscus, from a valgus blow with rotation.|الرباط الصليبي الأمامي بيمنع انزلاق القصبة لقدام على الفخذ. "الثالوث التعيس" هو الصليبي الأمامي + الجانبي الإنسي + الغضروف الهلالي الإنسي نتيجة ضربة بتفتح الركبة للخارج مع لف.',
 ['^Anterior cruciate','^Medial collateral','^Medial meniscus'],null],
['A man has a bulge above the inguinal ligament that passes through the deep inguinal ring, lateral to the inferior epigastric vessels. Which hernia?|راجل عنده انتفاخ فوق الرباط الإربي بيعدّي من الحلقة الإربية العميقة وجانبي لأوعية الشرسوفية السفلية. أنهي فتق؟',
 ['Indirect inguinal hernia|فتق إربي غير مباشر','Direct inguinal hernia|فتق إربي مباشر','Femoral hernia|فتق فخذي','Umbilical hernia|فتق سري'],
 'Indirect hernias leave through the deep ring (lateral to the inferior epigastric vessels) and may enter the scrotum inside the spermatic cord; direct hernias go through Hesselbach triangle (medial to the vessels). Femoral hernias are below and lateral to the pubic tubercle.|الفتق غير المباشر بيخرج من الحلقة العميقة (جانبي لأوعية الشرسوفية السفلية) وممكن ينزل للصفن جوه الحبل المنوي، والمباشر بيعدّي من مثلث هيسلباخ (إنسي للأوعية). الفتق الفخذي تحت وجانبي لحدبة العانة.',
 ['^Inferior epigastric artery','^Inguinal ligament'],null],
['A patient has colicky loin-to-groin pain from a kidney stone. At which narrow points can the ureter be obstructed?|مريض عنده مغص كلوي من الحالب بيمتد من الجنب للأربية بسبب حصوة. أنهي نقاط التضيق اللي ممكن الحصوة تقف فيها؟',
 ['Pelviureteric junction, pelvic brim, and vesicoureteric junction|الوصلة الحويضية الحالبية، حافة الحوض، والوصلة الحالبية المثانية','Only the vesicoureteric junction|الوصلة الحالبية المثانية فقط','Renal hilum and bladder neck|سرة الكلية وعنق المثانة','Iliac crest and inguinal ring|عرف الحرقفة والحلقة الإربية'],
 'Three constrictions: pelviureteric junction, where it crosses the pelvic brim (iliac vessels) and where it enters the bladder wall (narrowest). Pain travels loin-to-groin via T11–L2 (genitofemoral/ilioinguinal territory).|فيه 3 تضيقات: الوصلة الحويضية الحالبية، وعند عبور حافة الحوض (الأوعية الحرقفية)، وعند دخول جدار المثانة (الأضيق). الألم بيمتد من الجنب للأربية عن طريق T11–L2.',
 ['^Ureter$','^Kidney$'],null],
['A needle decompression for a tension pneumothorax is placed in the 2nd intercostal space at the midclavicular line, just above the 3rd rib. Why above the rib?|إبرة تفريغ الهواء لاسترواح الصدر الضاغط بتتحط في الفراغ الوربي التاني في الخط منتصف الترقوة فوق الضلع التالت. ليه فوق الضلع؟',
 ['The neurovascular bundle runs along the inferior border of each rib|الحزمة الوعائية العصبية بتمشي على الحافة السفلية لكل ضلع','Muscles are thinner above the rib|العضلات أرق فوق الضلع','The pleura is thicker above the rib|الجنبة أسمك فوق الضلع','The lung apex lies above the rib|قمة الرئة فوق الضلع'],
 'In the costal groove the order from superior to inferior is Vein–Artery–Nerve (VAN), so insert the needle at the upper border of the rib below to avoid them.|في الميزاب الضلعي الترتيب من فوق لتحت هو وريد–شريان–عصب (VAN)، فتدخل الإبرة عند الحافة العلوية للضلع اللي تحت عشان تتجنبهم.',
 ['^Right lung – ','^Rib 2|^Rib 3'],null],
['A lumbar puncture is performed in an adult at the L3–L4 level. Why is this level safe, and what layers does the needle cross?|بزل قطني بيتعمل لبالغ عند L3–L4. ليه المستوى ده آمن وإيه الطبقات اللي الإبرة بتعدّيها؟',
 ['The spinal cord ends at L1–L2; skin → supraspinous/interspinous ligaments → ligamentum flavum → epidural space → dura–arachnoid|النخاع الشوكي بينتهي عند L1–L2؛ جلد ← أربطة بين الشوكية ← الرباط الأصفر ← الحيز فوق الجافية ← الجافية والعنكبوتية','The cord ends at S2; the needle crosses the posterior longitudinal ligament|النخاع بينتهي عند S2 والإبرة بتعدّي الرباط الطولي الخلفي','The cord ends at T12 so L3–L4 contains only the filum|النخاع بينتهي عند T12','The cord ends at L5; the needle crosses the anterior longitudinal ligament|النخاع بينتهي عند L5'],
 'In adults the conus medullaris is at L1–L2 (L3 in infants). Below it the subarachnoid space holds the cauda equina floating in CSF, so the needle at L3–L4 (the line joining the iliac crests, L4) rarely hits the cord.|في البالغين نهاية النخاع عند L1–L2 (L3 عند الرضّع). تحتها الحيز تحت العنكبوتية فيه ذيل الفرس سايح في السائل المخي الشوكي، فالإبرة عند L3–L4 (خط عرفي الحرقفة ≈ L4) نادرا ما تلمس النخاع.',
 ['^Spinal cord$','^Lumbar vertebra L[34]|^L[34] '],null],
['A man has a stab wound just left of the sternum at the 4th–5th intercostal space. Which heart chamber is most likely injured?|راجل عنده طعنة على يسار عظمة القص عند الفراغ الوربي الرابع-الخامس. أنهي حجرة في القلب غالبا اتأذت؟',
 ['Right ventricle|البطين الأيمن','Left ventricle|البطين الأيسر','Right atrium|الأذين الأيمن','Left atrium|الأذين الأيسر'],
 'The right ventricle forms most of the anterior (sternocostal) surface of the heart, and so is most exposed behind the sternum and left parasternal region. The left atrium is the most posterior chamber.|البطين الأيمن بيكوّن معظم السطح الأمامي للقلب فهو الأكتر عرضة ورا القص وعلى يساره. الأذين الأيسر هو أكتر حجرة ناحية الخلف.',
 ['^Right ventricle$','^Body of sternum$'],null],
];

(() => {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const X = () => window.__anat || {};
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  Object.assign(STR, {
    clin: { en: 'Clinical anatomy cases', ar: 'حالات تشريح إكلينيكي' },
    clinSub: { en: 'Signs & symptoms → the injured structure · view it in 3D', ar: 'الأعراض ← التركيب المصاب · وشوفه على المجسم' },
  });
  const pair = (s) => { const i = s.indexOf('|'); return [s.slice(0, i), s.slice(i + 1)]; };
  const tt = (s) => { const p = pair(s); return T(p[0], p[1]); };
  const ROUND = 10;
  let deck = [], idx = 0, score = 0, ans = null, order = [];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const newRound = () => { deck = shuffle(CL.map((_, i) => i)).slice(0, ROUND); idx = 0; score = 0; ans = null; order = shuffle([0, 1, 2, 3]); };
  function quizHtml() {
    if (!deck.length) newRound();
    const head = `<h2>🩻 ${T('Clinical anatomy cases', 'حالات تشريح إكلينيكي')}</h2><div class="row" style="margin:2px 0 8px"><button class="btn" data-act="clstage">🩺 ${T('Stepwise cases', 'حالات بمراحل')}</button><button class="btn" data-act="clrep">📊 ${T('My progress', 'تقدمي')}</button></div><button class="btn p wide" style="margin:2px 0 8px" data-act="clhunt">🎯 ${T('Find the lesion on the 3D model', 'دوّر على الإصابة على المجسم')} ${A.isPremium() ? '' : '🔒'}</button><p class="tiny">${T('Draft content – to be reviewed by a physician before being relied on.', 'محتوى مسودة – محتاج مراجعة دكتور قبل الاعتماد عليه.')}</p>`;
    if (idx >= deck.length) {
      const pc = Math.round(score / deck.length * 100);
      return head + `<div class="pjcurve" style="text-align:center;padding:18px 12px"><div dir="ltr" style="font-size:34px;font-weight:800;margin:6px 0">${score} / ${deck.length}</div><p>${pc >= 80 ? T('Excellent!', 'ممتاز!') : pc >= 50 ? T('Good – review the missed ones.', 'كويس – راجع اللي غلطت فيه.') : T('Keep practising.', 'كمّل تدريب.')}</p><button class="btn p" data-act="clrestart">${T('New round', 'جولة جديدة')}</button></div>`;
    }
    const c = CL[deck[idx]], q = pair(c[0]);
    const opts = order.map((i) => {
      const ok = i === 0, st = ans === null ? '' : ok ? 'border-color:#3fd67a;background:rgba(63,214,122,.15)' : ans === i ? 'border-color:#ff6b6b;background:rgba(255,107,107,.15)' : '';
      return `<button class="btn" style="display:block;width:100%;margin:5px 0;text-align:start;${st}" data-act="clans" data-i="${i}" ${ans === null ? '' : 'disabled'}>${esc(tt(c[1][i]))}</button>`;
    }).join('');
    let fb = '';
    if (ans !== null) {
      fb = `<div class="pjcurve" style="margin-top:8px"><b>${ans === 0 ? T('Correct!', 'تمام!') : T('Not quite.', 'مش بالظبط.')}</b><p style="margin:4px 0 8px;font-size:13px;line-height:1.7">${esc(tt(c[2]))}</p>` +
        `<div class="row"><button class="btn" data-act="clshow">🧍 ${T('Show on the 3D model', 'اعرضه على المجسم')}</button><button class="btn p" data-act="clnext">${idx + 1 >= deck.length ? T('Finish', 'إنهاء') : T('Next', 'التالي')}</button></div></div>`;
    }
    return head + `<div class="pjcurve"><small><span>${T('Case', 'حالة')} ${idx + 1} / ${deck.length}</span> · <span>${T('Score', 'النتيجة')} ${score}</span></small><p style="margin:8px 0;font-size:14px;line-height:1.8">${esc(T(q[0], q[1]))}</p>${opts}</div>` + fb;
  }
    /* ─────────── progress report + staged cases ─────────── */
  const CATS = [['ul', 'Upper-limb nerves', 'أعصاب الطرف العلوي', [0, 1, 3, 4, 5, 6]], ['ll', 'Lower-limb nerves', 'أعصاب الطرف السفلي', [2, 8, 9, 10, 11]], ['hn', 'Head, neck & cranial nerves', 'الرأس والرقبة والأعصاب القحفية', [12, 15, 16, 17, 18, 19, 20]], ['th', 'Thorax', 'الصدر', [21, 26, 28]], ['ab', 'Abdomen, pelvis & spine', 'البطن والحوض والعمود الفقري', [13, 14, 24, 25, 27]], ['ms', 'Bones, joints & ligaments', 'العظام والمفاصل والأربطة', [7, 22, 23]]];
  const SKEY = 'anat_clin';
  const stats = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } };
  const rec = (k, ok) => { try { const s = stats(), r = s[k] || { n: 0, ok: 0 }; r.n++; if (ok) r.ok++; r.t = Date.now(); s[k] = r; localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* storage may be blocked */ } };
  const pct = (r) => (r && r.n ? Math.round(r.ok / r.n * 100) : null);
  let view = 'quiz';
  const repHtml = () => {
    const s = stats(); let tn = 0, tok = 0;
    const rows = CATS.map(([k, en, ar, ids]) => { let n = 0, ok = 0; ids.forEach((i) => { const r = s[i]; if (r) { n += r.n; ok += r.ok; } }); tn += n; tok += ok; return { en, ar, n, p: n ? Math.round(ok / n * 100) : null }; });
    const bar = (r) => `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${T(r.en, r.ar)}</span><span dir="ltr">${r.p === null ? T('not tried', 'لسه') : r.p + '% · ' + r.n}</span></div><div style="height:8px;border-radius:4px;background:var(--surface2);overflow:hidden;margin-top:4px"><div style="height:100%;width:${r.p || 0}%;background:${r.p === null ? 'transparent' : r.p >= 80 ? '#3fd67a' : r.p >= 50 ? '#e9b949' : '#ff6b6b'}"></div></div></div>`;
    const weak = weakDeck().slice(0, 5).map((i) => { const r = s[i], q = pair(CL[i][0]); return `<li style="margin:4px 0;font-size:13px">${esc(T(q[0], q[1]).slice(0, 90))}… <small dir="ltr">${r ? pct(r) + '%' : T('new', 'جديدة')}</small></li>`; }).join('');
    const sg = SG.map((c, i) => { const r = s['s' + i]; return r ? `<small>${pct(r)}%</small>` : ''; });
    return `<h2>📊 ${T('My clinical progress', 'تقدمي الإكلينيكي')}</h2><p class="tiny">${T('Saved on this device only.', 'محفوظ على الجهاز ده بس.')}</p>` +
      (tn ? '' : `<p>${T('No attempts yet – answer a few cases first.', 'لسه معملتش محاولات – جاوب كام حالة الأول.')}</p>`) + rows.map(bar).join('') +
      `<h3 style="margin:14px 0 4px">${T('Weakest cases', 'أضعف حالاتك')}</h3><ol style="padding-inline-start:20px">${weak}</ol>` +
      `<div class="row"><button class="btn p" data-act="clweak">🔁 ${T('Practise my weak spots', 'تدرّب على نقط ضعفي')}</button><button class="btn" data-act="clquiz">${T('Back', 'رجوع')}</button></div>`;
  };
  function weakDeck() {   // never-tried first, then the lowest accuracy
    const s = stats(); return CL.map((_, i) => i).sort((a, b) => { const ra = s[a], rb = s[b]; const sa = ra ? (pct(ra) + (ra.n > 3 ? 5 : 0)) : 40, sb = rb ? (pct(rb) + (rb.n > 3 ? 5 : 0)) : 40; return sa - sb || Math.random() - .5; });
  }
  const SG = [
    { nerve: 'radial_groove', hx: ['A 35-year-old man fell asleep with his arm over a chair after a party. He wakes up and cannot lift his hand.|راجل عنده 35 سنة نام وإيده متعلقة على كرسي بعد سهرة. صحي ومش قادر يرفع إيده.'],
      ex: [['Extend the wrist and fingers against resistance|بسط الرسغ والأصابع ضد مقاومة', 'Cannot extend – the wrist drops (wrist drop).|مش قادر – الرسغ بيقع (سقوط الرسغ).', 2], ['Sensation over the dorsum of the first web space|الإحساس على ظهر الحيز بين الإبهام والسبابة', 'Reduced.|ناقص.', 2], ['Triceps power and reflex|قوة ومنعكس ثلاثية الرؤوس', 'Normal – the lesion is distal to the triceps branches.|طبيعي – الإصابة بعد فروع الثلاثية.', 2], ['Finger abduction / adduction|فتح وضم الأصابع', 'Normal.|طبيعي.', 0], ['Thumb opposition|مقابلة الإبهام', 'Normal.|طبيعي.', 0], ['Elbow flexion (biceps)|ثني الكوع', 'Normal.|طبيعي.', 0]],
      dx: ['Radial nerve in the spiral groove|العصب الكعبري في الميزاب الحلزوني', 'Posterior cord of the brachial plexus (axilla)|الحبل الخلفي للضفيرة', 'Posterior interosseous nerve only|العصب بين العظمين الخلفي فقط', 'Median nerve at the wrist|العصب الأوسط عند الرسغ'],
      exp: ['A wrist drop with normal triceps places the lesion in the spiral groove (distal to the triceps branches). A posterior-cord / axillary lesion would also weaken triceps and deltoid; a posterior interosseous lesion spares wrist extension (extensor carpi radialis longus) and sensation.|سقوط الرسغ مع ثلاثية رؤوس سليمة بيحدد الإصابة في الميزاب الحلزوني (بعد فروع الثلاثية). إصابة الحبل الخلفي بتضعف الثلاثية والدالية كمان، وإصابة العصب بين العظمين الخلفي بتسيب بسط الرسغ والإحساس سليمين.'] },
    { nerve: 'common_fibular', hx: ['A footballer was kicked on the outer side of the knee. Since then his foot slaps on the ground when he walks.|لاعب كورة اتضرب على الناحية الخارجية للركبة. من وقتها قدمه بتخبط في الأرض وهو ماشي.'],
      ex: [['Dorsiflexion of the ankle|رفع القدم لفوق', 'Impossible – foot drop with a high-stepping gait.|مش ممكن – قدم متدلية ومشية عالية الخطوة.', 2], ['Eversion of the foot|تقليب القدم للخارج', 'Weak.|ضعيف.', 2], ['Sensation over the dorsum of the foot and lateral leg|الإحساس على ظهر القدم وجانب الساق', 'Reduced.|ناقص.', 2], ['Plantar flexion (gastrocnemius)|ثني القدم لتحت', 'Normal – tibial nerve intact.|طبيعي – العصب الظنبوبي سليم.', 1], ['Foot inversion|تقليب القدم للداخل', 'Normal (tibialis posterior – tibial nerve).|طبيعي (الظنبوبية الخلفية – العصب الظنبوبي).', 1], ['Knee jerk|منعكس الركبة', 'Normal.|طبيعي.', 0]],
      dx: ['Common fibular (peroneal) nerve at the fibular neck|العصب الشظوي المشترك عند رقبة الشظية', 'Tibial nerve|العصب الظنبوبي', 'Sciatic nerve in the buttock|العصب الوركي في الإلية', 'L5 radiculopathy only|اعتلال جذر L5 فقط'],
      exp: ['Foot drop with weak eversion and dorsal-foot numbness, but normal plantar flexion and inversion, localises to the common fibular nerve at the fibular neck. A sciatic lesion would also weaken plantar flexion and inversion and the hamstrings.|القدم المتدلية مع ضعف التقليب للخارج وتنميل ظهر القدم، وثني القدم لتحت والتقليب للداخل سليمين، بتحدد العصب الشظوي المشترك عند رقبة الشظية. إصابة الوركي كانت هتضعف كمان ثني القدم لتحت والتقليب للداخل والعضلات الخلفية للفخذ.'] },
    { nerve: 'ulnar_wrist', hx: ['A cyclist has had numbness of the little finger and difficulty gripping the handlebars for weeks.|سواق عجلة عنده تنميل في الخنصر وصعوبة في مسك المقود بقاله أسابيع.'],
      ex: [['Finger abduction / adduction (interossei)|فتح وضم الأصابع', 'Weak; ring and little fingers are clawed.|ضعيف؛ البنصر والخنصر مخلبيين.', 2], ['Froment sign (hold paper between thumb and index)|علامة فرومنت (مسك ورقة بين الإبهام والسبابة)', 'Positive – the thumb flexes to compensate.|إيجابية – الإبهام بيتني للتعويض.', 2], ['Sensation over the little finger and the palmar ulnar border|الإحساس في الخنصر وحافة الكف الزندية', 'Reduced.|ناقص.', 2], ['Sensation over the dorsal ulnar side of the hand|الإحساس على الظهر الزندي لليد', 'Normal – the dorsal branch leaves above the wrist.|طبيعي – الفرع الظهري بيخرج قبل الرسغ.', 2], ['Wrist flexion with ulnar deviation (FCU)|ثني الرسغ مع ميل زندي', 'Strong – FCU is spared.|قوي – العضلة الزندية الثانية سليمة.', 1], ['Thumb opposition|مقابلة الإبهام', 'Normal.|طبيعي.', 0]],
      dx: ['Ulnar nerve at the wrist (Guyon canal)|العصب الزندي عند الرسغ (قناة جيّون)', 'Ulnar nerve at the elbow (cubital tunnel)|العصب الزندي عند الكوع', 'C8–T1 roots (lower trunk)|الجذور C8–T1 (الجذع السفلي)', 'Median nerve at the carpal tunnel|العصب الأوسط في النفق الرسغي'],
      exp: ['Intrinsic hand weakness and palmar little-finger numbness with a normal dorsal ulnar sensation and a strong FCU puts the lesion at the wrist (Guyon canal); an elbow lesion would also reduce FCU and dorsal-ulnar sensation.|ضعف عضلات اليد الصغيرة وتنميل الخنصر من ناحية الكف، مع إحساس طبيعي بالظهر الزندي وعضلة زندية قوية، بيحدد الإصابة عند الرسغ (قناة جيّون). إصابة الكوع كانت هتضعف كمان العضلة الزندية والإحساس بالظهر.'] },
    { nerve: 'axillary', hx: ['A young man dislocated his shoulder anteriorly while playing rugby; it was reduced in the ER. Now he cannot raise his arm to the side.|شاب خلع كتفه للأمام في رجبي واتردّ في الطوارئ. دلوقتي مش قادر يرفع دراعه للجنب.'],
      ex: [['Abduction beyond the first 15°|فتح الدراع بعد أول 15 درجة', 'Weak – cannot hold the arm up.|ضعيف – مش قادر يثبّت الدراع لفوق.', 2], ['Sensation over the lateral shoulder (regimental badge)|الإحساس على جانب الكتف (الشارة)', 'Reduced.|ناقص.', 2], ['Initiation of abduction (first 15°)|بدء فتح الدراع (أول 15 درجة)', 'Possible – supraspinatus is intact.|ممكن – فوق الشوكة سليمة.', 1], ['External rotation (teres minor)|الدوران للخارج', 'Weak.|ضعيف.', 1], ['Elbow flexion and sensation over the lateral forearm|ثني الكوع وإحساس الساعد الجانبي', 'Normal – musculocutaneous nerve intact.|طبيعي – العصب العضلي الجلدي سليم.', 0], ['Wrist extension|بسط الرسغ', 'Normal.|طبيعي.', 0]],
      dx: ['Axillary nerve|العصب الإبطي', 'Suprascapular nerve|العصب فوق الكتف', 'Radial nerve|العصب الكعبري', 'Musculocutaneous nerve|العصب العضلي الجلدي'],
      exp: ['The axillary nerve wraps the surgical neck of the humerus and is injured in anterior dislocation: deltoid and teres minor weakness with sensory loss over the lateral shoulder. The initial 15° of abduction (supraspinatus – suprascapular nerve) is preserved.|العصب الإبطي بيلف حوالين الرقبة الجراحية للعضد وبيتأذى في الخلع الأمامي: ضعف الدالية والمدورة الصغرى وفقد الإحساس بجانب الكتف. أول 15 درجة من الفتح (فوق الشوكة – العصب فوق الكتف) سليمة.'] },
    { nerve: 'femoral', hx: ['After a long pelvic operation a patient says his right knee gives way when he climbs stairs.|بعد عملية طويلة في الحوض مريض بيقول إن ركبته اليمين بتخونه وهو بيطلع السلم.'],
      ex: [['Knee extension against resistance|فرد الركبة ضد مقاومة', 'Weak – quadriceps.|ضعيف – الرباعية.', 2], ['Patellar reflex|منعكس الرضفة', 'Absent.|مفقود.', 2], ['Sensation over the anterior thigh and medial leg|الإحساس على مقدمة الفخذ وإنسية الساق', 'Reduced.|ناقص.', 2], ['Hip adduction|ضم الفخذ', 'Normal – obturator nerve intact.|طبيعي – العصب السدادي سليم.', 1], ['Ankle dorsiflexion and plantar flexion|حركة القدم لفوق ولتحت', 'Normal.|طبيعية.', 0], ['Hip abduction|فتح الفخذ', 'Normal.|طبيعي.', 0]],
      dx: ['Femoral nerve|العصب الفخذي', 'Obturator nerve|العصب السدادي', 'Sciatic nerve|العصب الوركي', 'Superior gluteal nerve|العصب الإلوي العلوي'],
      exp: ['Quadriceps weakness, absent patellar reflex and anterior-thigh sensory loss with preserved adductors point to the femoral nerve (L2–L4), classically injured by retractors in pelvic surgery or an iliacus haematoma.|ضعف الرباعية ومنعكس الرضفة المفقود وفقد إحساس مقدمة الفخذ مع سلامة المقرّبات بتدل على العصب الفخذي (L2–L4)، وبيتأذى غالبا من الفاتحات في جراحات الحوض أو ورم دموي في الحرقفية.'] },
    { nerve: 'median_wrist', hx: ['A woman who works at a keyboard wakes at night with burning fingers and drops cups.|ست بتشتغل على الكيبورد بتصحى بالليل وصوابعها بتحرقها وبتوقّع الأكواب.'],
      ex: [['Phalen test (wrist flexion for 60 s)|اختبار فالن (ثني الرسغ دقيقة)', 'Positive – tingling reproduced.|إيجابي – التنميل رجع.', 2], ['Thumb opposition and abduction|مقابلة الإبهام وإبعاده', 'Weak.|ضعيفة.', 2], ['Sensation over the thenar eminence|الإحساس على بروز الإبهام', 'Normal – the palmar cutaneous branch arises above the tunnel.|طبيعي – الفرع الجلدي الراحي بيطلع قبل النفق.', 2], ['Sensation over the thumb, index and middle fingers|الإحساس في الإبهام والسبابة والوسطى', 'Reduced.|ناقص.', 2], ['Flexion of the finger tips (FDP/FDS)|ثني أطراف الأصابع', 'Normal – forearm muscles are spared.|طبيعي – عضلات الساعد سليمة.', 1], ['Finger abduction / adduction|فتح وضم الأصابع', 'Normal.|طبيعي.', 0]],
      dx: ['Median nerve compression in the carpal tunnel|ضغط العصب الأوسط في النفق الرسغي', 'Median nerve at the elbow (pronator syndrome)|العصب الأوسط عند الكوع', 'C6 radiculopathy|اعتلال جذر C6', 'Ulnar nerve at Guyon canal|العصب الزندي في قناة جيّون'],
      exp: ['Thenar weakness and lateral-3½-digit numbness with sparing of the thenar eminence skin and of the forearm flexors localises the lesion to the carpal tunnel, distal to the palmar cutaneous branch.|ضعف عضلات الإبهام وتنميل 3 أصابع ونص مع سلامة جلد بروز الإبهام وعضلات الساعد بيحدد الإصابة في النفق الرسغي، بعد الفرع الجلدي الراحي.'] },
  ];
  let sg = null;   // { i, asked:Set, stage:'ex'|'dx'|'done', order, pick }
  const sgList = () => `<h2>🩺 ${T('Stepwise cases', 'حالات بمراحل')}</h2><p class="tiny">${T('Take the history, choose your examinations, watch the patient on the 3D model, then decide. Draft content – physician review needed.', 'خد التاريخ المرضي، اختار الفحوصات، شوف المريض على المجسم، وبعدين قرّر. محتوى مسودة – محتاج مراجعة دكتور.')}</p>` +
    SG.map((c, i) => { const r = stats()['s' + i]; return `<button class="btn" style="display:block;width:100%;margin:6px 0;text-align:start" data-act="sgopen" data-i="${i}">${i + 1}. ${esc(tt(c.hx[0]).slice(0, 80))}… ${r ? '<small>(' + pct(r) + '%)</small>' : ''}</button>`; }).join('') +
    `<div class="row"><button class="btn" data-act="clquiz">${T('Back', 'رجوع')}</button></div>`;
  const sgCase = () => {
    const c = SG[sg.i], ex = c.ex.map((e, j) => { const on = sg.asked.has(j); const rs = pair(e[1]); return `<div style="margin:4px 0"><button class="btn" style="width:100%;text-align:start;${on ? 'opacity:.75' : ''}" data-act="sgex" data-j="${j}" ${on ? 'disabled' : ''}>🔎 ${esc(tt(e[0]))}</button>${on ? `<div style="padding:4px 10px;font-size:13px;color:#7fd8a0">→ ${esc(T(rs[0], rs[1]))}</div>` : ''}</div>`; }).join('');
    let tail = '';
    if (sg.stage === 'ex') tail = `<div class="row" style="margin-top:8px"><button class="btn" data-act="sgsim">🧍 ${T('Watch the patient on the 3D model', 'شوف المريض على المجسم')} ${A.isPremium() ? '' : '🔒'}</button><button class="btn p" data-act="sgdx">${T('I am ready to decide', 'جاهز أقرّر')}</button></div>`;
    else {
      const ok = sg.pick === 0, o = sg.order.map((k) => { const st = sg.stage === 'done' ? (k === 0 ? 'border-color:#3fd67a;background:rgba(63,214,122,.15)' : sg.pick === k ? 'border-color:#ff6b6b;background:rgba(255,107,107,.15)' : '') : ''; return `<button class="btn" style="display:block;width:100%;margin:5px 0;text-align:start;${st}" data-act="sgans" data-k="${k}" ${sg.stage === 'done' ? 'disabled' : ''}>${esc(tt(c.dx[k]))}</button>`; }).join('');
      tail = `<h3 style="margin:10px 0 2px">${T('Where is the lesion / what is the diagnosis?', 'فين الإصابة / إيه التشخيص؟')}</h3>${o}`;
      if (sg.stage === 'done') tail += `<div class="pjcurve" style="margin-top:8px"><b>${ok ? T('Correct!', 'تمام!') : T('Not quite.', 'مش بالظبط.')} ${sg.pts !== undefined ? '+' + sg.pts : ''}</b><p style="font-size:13px;line-height:1.7;margin:4px 0">${esc(tt(c.exp[0]))}</p><div class="row"><button class="btn" data-act="sgsim">🧍 ${T('See it on the model', 'شوفها على المجسم')}</button><button class="btn p" data-act="clstage">${T('More cases', 'حالات تانية')}</button></div></div>`;
    }
    return `<h2>🩺 ${T('Stepwise case', 'حالة بمراحل')} ${sg.i + 1}</h2><div class="pjcurve"><p style="margin:0;line-height:1.8">${esc(tt(c.hx[0]))}</p></div><h3 style="margin:10px 0 2px">${T('Examinations', 'الفحوصات')} <small>(${sg.asked.size}/${c.ex.length})</small></h3>${ex}${tail}`;
  };
  const html = () => (view === 'rep' ? repHtml() : view === 'stl' ? sgList() : view === 'stg' && sg ? sgCase() : quizHtml());
  const show = (v) => { view = v; if (!$('modal') || $('modal').hidden) A.modal(html); else A.rerenderModal(); };
  A.acts.clrep = () => show('rep'); A.acts.clquiz = () => show('quiz'); A.acts.clstage = () => show('stl');
  A.acts.clweak = () => { deck = weakDeck().slice(0, ROUND); idx = 0; score = 0; ans = null; order = shuffle([0, 1, 2, 3]); show('quiz'); };
  A.acts.sgopen = (el) => { sg = { i: +el.dataset.i, asked: new Set(), stage: 'ex', order: shuffle([0, 1, 2, 3]) }; show('stg'); };
  A.acts.sgex = (el) => { if (sg && sg.stage === 'ex') { sg.asked.add(+el.dataset.j); A.rerenderModal(); } };
  A.acts.sgdx = () => { if (sg) { sg.stage = 'dx'; A.rerenderModal(); } };
  A.acts.sgans = (el) => { if (!sg || sg.stage === 'done') return; sg.pick = +el.dataset.k; const c = SG[sg.i], key = c.ex.filter((e) => e[2] === 2).length, got = [...sg.asked].filter((j) => c.ex[j][2] === 2).length, waste = [...sg.asked].filter((j) => c.ex[j][2] === 0).length;
    sg.pts = sg.pick === 0 ? Math.max(1, 3 - (got < Math.min(2, key) ? 1 : 0) - (waste > 1 ? 1 : 0)) : 0; sg.stage = 'done'; rec('s' + sg.i, sg.pick === 0); A.rerenderModal(); };
  A.acts.sgsim = () => {
    if (!sg) return; if (!A.isPremium()) return A.paywall('Watching the patient on the 3D model is part of Premium.', 'مشاهدة المريض على المجسم ضمن النسخة المميزة.');
    const id = SG[sg.i].nerve; A.closeModal();
    Promise.resolve(A.acts.nsim({ dataset: { id } })).then(() => { const b = document.createElement('div'); b.id = 'hntbar'; b.innerHTML = `<div class="hr"><button class="p" data-act="sgreturn">⬅ ${T('Back to the case', 'رجوع للحالة')}</button></div>`; const old = $('hntbar'); if (old) old.remove(); $('app').appendChild(b); });
  };
  A.acts.sgreturn = () => { A.acts.movend(); const b = $('hntbar'); if (b) b.remove(); show('stg'); };
  const open = () => { newRound(); view = 'quiz'; A.modal(html); };
  A.acts.clans = (el) => { if (ans !== null) return; ans = +el.dataset.i; rec(deck[idx], ans === 0); if (ans === 0) score++; A.rerenderModal(); };
  A.acts.clnext = () => { idx++; ans = null; order = shuffle([0, 1, 2, 3]); A.rerenderModal(); };
  A.acts.clrestart = () => { newRound(); A.rerenderModal(); };
  A.acts.clshow = async () => {
    const c = CL[deck[idx]]; if (!c) return;
    const res = c[3].map((r) => new RegExp(r, 'i'));
    const base = (e) => e.baseEn || e.en;
    const sd = c[4] || 'r';   // one side only, so the camera frames the structure and not the whole body
    let hit = P.filter((e) => res.some((r) => r.test(base(e))) && (e.side === sd || (e.side !== 'r' && e.side !== 'l')));
    if (!hit.length) hit = P.filter((e) => res.some((r) => r.test(base(e))));
    if (!hit.length) return;
    A.closeModal();
    const sys = [...new Set(hit.map((e) => e.sys))];
    S.region = null; S.iso = -1; S.hidden = new Set();
    for (const s of sys) { S.layers[s] = 'on'; try { await A.ensure(s); } catch (e) { /* ignore */ } }
    S.focus = new Set(hit.map((e) => e.i)); S.sel = -1; A.deselect();
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const e of hit) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], e.c[k] - (e.r || .05) * 0.6); hi[k] = Math.max(hi[k], e.c[k] + (e.r || .05) * 0.6); }
    const cen = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2), ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    X().cam.flyTo([cen[0], Math.max(0.05, cen[1]), cen[2]], Math.max(0.5, ext * 1.5 + 0.3), null, 0.1);
    A.apply(); A.toast(T('Showing the structures – "Show all" restores the view', 'عرض التراكيب المعنية — زر «إظهار الكل» يرجّع العرض'), 4200);
  };

  /* ─────────── "Find the lesion": read the case, then tap the injured structure on the 3D model ─────────── */
  const SYSL = { nerve: ['a nerve', 'عصب'], vessel: ['a blood vessel', 'وعاء دموي'], muscle: ['a muscle', 'عضلة'], bone: ['a bone', 'عظمة'], ligament: ['a ligament', 'رباط'], organ: ['an organ', 'عضو'], brain: ['a brain structure', 'تركيب في المخ'] };
  const SKIP = [12, 24, 26, 27];   // cases whose target is not modelled (recurrent laryngeal nerve, deep inguinal ring…) or is not a single structure
  const css = document.createElement('style');
  css.textContent = '#hntbar{position:absolute;left:50%;transform:translateX(-50%);top:104px;z-index:31;display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:10px 14px;border-radius:16px;background:var(--surface);border:1px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:calc(100vw - 96px);width:420px;font-size:13px}#hntbar .hq{font-weight:700;line-height:1.7}#hntbar .hs{opacity:.7;font-size:12px}#hntbar .hmsg{line-height:1.7}#hntbar .hr{display:flex;gap:8px;align-items:center;justify-content:center}#hntbar button{border:0;background:var(--surface2);color:inherit;min-width:38px;height:34px;padding:0 12px;border-radius:17px;font-size:14px;cursor:pointer}#hntbar button.p{background:var(--accent,#e9b949);color:#1a1a1a;font-weight:700}';
  document.head.appendChild(css);
  let H = null;
  const bar = (h) => { let b = $('hntbar'); if (!b) { b = document.createElement('div'); b.id = 'hntbar'; $('app').appendChild(b); } b.innerHTML = h; };
  const stopHunt = () => { H = null; const b = $('hntbar'); if (b) b.remove(); S.hl = null; A.apply(); };
  const base = (e) => e.baseEn || e.en;
  const target = (c, sd) => { const re = new RegExp(c[3][0], 'i'); let l = P.filter((e) => re.test(base(e)) && (e.side === sd || (e.side !== 'r' && e.side !== 'l'))); if (!l.length) l = P.filter((e) => re.test(base(e))); return l; };
  const hdr = () => `<div class="hs">${T('Find the lesion', 'دوّر على الإصابة')} · ${T('Case', 'حالة')} ${H.i + 1}/${H.deck.length} · ${T('Score', 'النتيجة')} ${H.score}</div>`;
  function huntCase() {
    const c = CL[H.deck[H.i]], q = pair(c[0]); H.tries = 0; H.hint = 0; H.done = false; S.hl = null; A.apply();
    bar(hdr() + `<div class="hq">${esc(T(q[0], q[1]))}</div><div class="hmsg" id="hntmsg">👆 ${T('Tap the injured structure on the model (peel the layers from the bottom chips if you need to).', 'دوس على التركيب المصاب في المجسم (قشّر الطبقات من الأزرار اللي تحت لو محتاج).')}</div><div class="hr"><button data-act="hnthint" title="${T('Hint (−1 point)', 'تلميح (−1 نقطة)')}">💡</button><button data-act="hntskip" title="${T('Skip', 'تخطّي')}">⏭</button><button data-act="hntend">✕</button></div>`);
  }
  async function huntStart() {
    if (!A.isPremium()) return A.paywall('Find-the-lesion is part of Premium (it needs nerves, vessels and ligaments).', 'دوّر على الإصابة ضمن النسخة المميزة (محتاجة الأعصاب والأوعية والأربطة).');
    A.closeModal(); S.sel = -1; A.deselect();
    for (const s of ['bone', 'nerve', 'vessel', 'ligament', 'organ', 'muscle']) { S.layers[s] = s === 'muscle' ? 'ghost' : 'on'; try { await A.ensure(s); } catch (e) { /* ignore */ } }
    S.region = null; S.iso = -1; S.focus = null; S.moveSet = null; S.hidden = new Set();
    H = { deck: shuffle(CL.map((_, i) => i).filter((i) => !SKIP.includes(i))).slice(0, 8), i: 0, score: 0, tries: 0, hint: 0, done: false };
    X().cam.reset(); huntCase();
  }
  function reveal(c, sd, pts, why) {
    const hit = target(c, sd), hl = new Map(); hit.forEach((e) => hl.set(e.i, pts > 0 ? [0.25, 0.95, 0.45, 0.95] : [1, 0.55, 0.2, 0.95]));
    S.hl = hl; A.apply(); if (hit[0]) A.flyToPart(hit[0]); H.done = true; H.score += pts; rec(H.deck[H.i], pts >= 2);
    const last = H.i + 1 >= H.deck.length;
    bar(hdr() + `<div class="hq">${pts > 0 ? '✅' : '👀'} ${esc(why)}</div><div class="hmsg">${esc(tt(c[2]))}</div><div class="hr"><button class="p" data-act="hntnext">${last ? T('Finish', 'إنهاء') : T('Next case', 'الحالة اللي بعدها')}</button><button data-act="hntend">✕</button></div>`);
  }
  function huntTap(e) {
    const c = CL[H.deck[H.i]], sd = e.side === 'r' || e.side === 'l' ? e.side : 'r', nm = (A.name1 && A.name1(e)) || e.en;
    if (new RegExp(c[3][0], 'i').test(base(e))) { const pts = Math.max(1, 3 - H.tries - H.hint); return reveal(c, sd, pts, T('Correct! +', 'صح! +') + pts); }
    H.tries++; const m = $('hntmsg'); if (!m) return;
    if (H.tries >= 3) return reveal(c, c[4] || 'r', 0, T('Here is the structure.', 'ده التركيب المقصود.'));
    let extra = '';
    if (H.tries === 1) { const sl = SYSL[(target(c, c[4] || 'r')[0] || {}).sys]; if (sl) extra = ' ' + T('Hint: it is ' + sl[0] + '.', 'تلميح: هو ' + sl[1] + '.'); }
    else { const t0 = target(c, c[4] || 'r')[0]; if (t0) X().cam.flyTo(t0.c, 1.0, null, 0.1); extra = ' ' + T('Look in this area.', 'بص في المنطقة دي.'); }
    m.textContent = '✖ ' + nm + ' — ' + T('not it.', 'مش هو.') + extra + ' (' + (3 - H.tries) + ' ' + T('tries left', 'محاولات متبقية') + ')';
  }
  A.acts.clhunt = huntStart;
  A.acts.hntnext = () => { if (!H) return; H.i++; if (H.i >= H.deck.length) { const mx = H.deck.length * 3; bar(`<div class="hq">🎯 ${T('Round finished', 'خلصت الجولة')}: ${H.score} / ${mx}</div><div class="hmsg">${H.score >= mx * 0.8 ? T('Excellent localisation!', 'تحديد ممتاز!') : H.score >= mx * 0.5 ? T('Good – review the missed cases.', 'كويس – راجع الحالات اللي فاتتك.') : T('Keep practising – try the multiple-choice mode to review the explanations.', 'كمّل تدريب – جرّب وضع الاختيارات عشان تراجع الشروحات.')}</div><div class="hr"><button class="p" data-act="clhunt">${T('New round', 'جولة جديدة')}</button><button data-act="hntend">✕</button></div>`); S.hl = null; A.apply(); return; } huntCase(); };
  A.acts.hnthint = () => { if (!H || H.done) return; const c = CL[H.deck[H.i]], t0 = target(c, c[4] || 'r')[0]; if (!t0) return; H.hint = Math.min(2, H.hint + 1); const m = $('hntmsg'); if (!m) return; if (H.hint === 1) { const sl = SYSL[t0.sys]; m.textContent = '💡 ' + T('It is ' + (sl ? sl[0] : 'a structure') + '.', 'هو ' + (sl ? sl[1] : 'تركيب') + '.'); } else { X().cam.flyTo(t0.c, 1.0, null, 0.1); m.textContent = '💡 ' + T('Look in this area.', 'بص في المنطقة دي.'); } };
  A.acts.hntskip = () => { if (!H || H.done) return; const c = CL[H.deck[H.i]]; reveal(c, c[4] || 'r', 0, T('Skipped – here is the structure.', 'اتخطّت – ده التركيب.')); };
  A.acts.hntend = stopHunt;
  waitFor(() => A.onTap, () => { const prev = A.onTap; A.onTap = (x, y) => { if (H && !H.done) { const idx = X().R.pick(X().cam, x, y); if (idx >= 0 && P[idx]) huntTap(P[idx]); return true; } return prev(x, y); }; });
  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.clin = open; });
})();
